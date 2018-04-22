export default class Media {
  constructor(width, height = width) {
    this.video = document.createElement('video')
    this.video.width = width
    this.video.height = height
    this.video.loop = true
    this.video.muted = 'true'
    this.toggleThumb(false)

    document.body.appendChild(this.video)
  }

  enumerateDevices() {
    return navigator.mediaDevices.enumerateDevices().then(mediaDeviceInfos => {
      this.videoDevices = {}
      mediaDeviceInfos.forEach(mediaDeviceInfo => {
        switch (mediaDeviceInfo.kind) {
          case 'videoinput':
            this.videoDevices[mediaDeviceInfo.label.replace(/ \(.+?\)/, '')] = mediaDeviceInfo.deviceId
            break
        }
      })
    })
  }

  getUserMedia(videoSource) {
    return new Promise(resolve => {
      // get webcam
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: { deviceId: { exact: videoSource } }
        })
        .then(stream => {
          // on webcam enabled
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
        })
        .catch(() => {
          prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.'
        })
    })
  }

  update() {
    let max = 0
    this.analyser.getByteTimeDomainData(this.array)
    for (let i = 0; i < this.analyser.fftSize; ++i) {
      max = Math.max(this.array[i], max)
    }
    return max
  }

  toggleThumb(showThumb) {
    this.video.style.display = showThumb ? 'block' : 'none'
  }
}
