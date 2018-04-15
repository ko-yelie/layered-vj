export default class Media {
  constructor (width, height = width) {
    const video = document.createElement('video')
    video.width = width
    video.height = height
    video.loop = true

    this.promise = new Promise(resolve => {
      //get webcam
      navigator.getUserMedia({
        audio: true,
        video: true
      }, stream => {
        //on webcam enabled
        video.srcObject = stream

        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(stream)
        this.analyser = audioCtx.createAnalyser()
        this.analyser.fftSize = height
        source.connect(this.analyser)
        this.array = new Uint8Array(this.analyser.fftSize)

        const playVideo = () => {
          // 複数回呼ばれないようにイベントを削除
          video.removeEventListener('canplay', playVideo)
          // video 再生開始をコール
          video.play()
          video.muted = 'true' // ビデオはミュートする

          resolve(video)
        }
        video.addEventListener('canplay', playVideo)
      }, error => {
        prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.'
      })
    })
  }

  update () {
    let max = 0
    this.analyser.getByteTimeDomainData(this.array)
    for (let i = 0; i < this.analyser.fftSize; ++i) {
      max = Math.max(this.array[i], max)
    }
    return max
  }
}
