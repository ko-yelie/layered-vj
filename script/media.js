export default class Media {
  constructor (width, height = width) {
    this.video = document.createElement('video')
    this.video.width = width
    this.video.height = height
    this.video.loop = true
    this.video.muted = 'true' // 音が出ないようにする

    this.promise = Promise.all([
      this.enumerateDevices()
    ])
  }

  enumerateDevices () {
    return new Promise(resolve => {
      navigator.mediaDevices.enumerateDevices().then(mediaDeviceInfos => {
        this.videoDevices = {}
        mediaDeviceInfos.forEach(mediaDeviceInfo => {
          switch (mediaDeviceInfo.kind) {
            case 'videoinput':
              this.videoDevices[mediaDeviceInfo.label] = mediaDeviceInfo.deviceId
              break;
          }
        })
        resolve()
      })
    })
  }

  getUserMedia (videoSource) {
    return new Promise(resolve => {
      //get webcam
      navigator.getUserMedia({
        audio: true,
        video: {
          deviceId: { exact: videoSource }
        }
      }, stream => {
        //on webcam enabled
        this.video.srcObject = stream

        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(stream)
        this.analyser = audioCtx.createAnalyser()
        this.analyser.fftSize = this.video.height
        source.connect(this.analyser)
        this.array = new Uint8Array(this.analyser.fftSize)

        const playVideo = () => {
          // 複数回呼ばれないようにイベントを削除
          this.video.removeEventListener('canplay', playVideo)
          // video 再生開始をコール
          this.video.play()

          resolve()
        }
        this.video.addEventListener('canplay', playVideo)
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
