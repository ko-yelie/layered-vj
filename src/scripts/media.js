import getElements from 'get-elements-array'

export default class Media {
  constructor (size, pointResolution) {
    this.video = document.createElement('video')
    this.video.width = size
    this.video.height = size
    this.video.loop = true
    this.video.muted = true

    this.wrapper = document.getElementById('video-wrapper')
    this.wrapper.appendChild(this.video)

    this.toggleThumb(false)

    this.size = size
    this.pointResolution = pointResolution

    this.loadSmartphone()
  }

  // smartphone webcam
  loadSmartphone () {
    const smartphone = document.getElementById('smartphone')
    if (!smartphone) return

    this.smartphone = smartphone
    this.smartphone.width = this.size
    this.smartphone.height = this.size
  }

  enumerateDevices () {
    return navigator.mediaDevices.enumerateDevices().then(mediaDeviceInfos => {
      this.videoDevices = {}
      this.videoFiles = {}
      this.audioDevices = {}

      mediaDeviceInfos.forEach(mediaDeviceInfo => {
        switch (mediaDeviceInfo.kind) {
          case 'videoinput':
            this.videoDevices[mediaDeviceInfo.label.replace(/ \(.+?\)/, '')] = mediaDeviceInfo.deviceId
            break
          case 'audioinput':
            this.audioDevices[mediaDeviceInfo.label.replace(/ \(.+?\)/, '')] = mediaDeviceInfo.deviceId
            break
        }
      })

      if (this.smartphone) {
        this.videoDevices['Smartphone'] = 'smartphone'
      }

      getElements('.js-video').forEach(video => {
        const id = `file:${video.id}`
        video.width = this.size
        video.height = this.size
        video.loop = true
        video.muted = true
        this.videoDevices[`File: ${video.innerText}`] = id
        this.videoFiles[id] = video
      })
    })
  }

  getUserMedia (sources) {
    let videoFile, smartphoneFile
    if (/^file:/.test(sources.video)) {
      videoFile = this.videoFiles[sources.video]
    } else if (sources.video === 'smartphone') {
      smartphoneFile = this.smartphone
    }
    this.videoSource = sources.video || this.videoSource
    this.audioSource = sources.audio || this.audioSource

    return new Promise(resolve => {
      // get webcam
      navigator.mediaDevices
        .getUserMedia({
          audio: { deviceId: this.audioSource },
          video: { deviceId: this.videoSource }
        })
        .then(stream => {
          // on webcam enabled
          if (videoFile) {
            this.currentVideo && (this.currentVideo.style.display = 'none')
            this.currentVideo = videoFile
            videoFile.style.display = 'block'
          } else if (smartphoneFile) {
            this.currentVideo && (this.currentVideo.style.display = 'none')
            this.currentVideo = smartphoneFile
            smartphoneFile.style.display = 'block'
          } else {
            this.currentVideo && (this.currentVideo.style.display = 'none')
            this.video.srcObject = stream
            this.currentVideo = this.video
            this.video.style.display = 'block'
          }

          const audioCtx = new AudioContext()
          const source = audioCtx.createMediaStreamSource(stream)
          // const source = audioCtx.createMediaElementSource(this.currentVideo)
          this.analyser = audioCtx.createAnalyser()
          this.analyser.fftSize = this.pointResolution
          source.connect(this.analyser)
          this.array = new Uint8Array(this.analyser.fftSize)

          const playVideo = () => {
            // 複数回呼ばれないようにイベントを削除
            this.currentVideo.removeEventListener('canplay', playVideo)
            // video 再生開始をコール
            this.currentVideo.play()

            resolve(this.currentVideo)
          }

          if (smartphoneFile) {
            resolve(this.currentVideo)
          } else if (this.currentVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            playVideo()
          } else {
            this.currentVideo.addEventListener('canplay', playVideo)
          }
        })
        .catch(e => {
          console.error(e)
        })
    })
  }

  getVolume () {
    let max = 0
    this.analyser.getByteTimeDomainData(this.array)
    for (let i = 0; i < this.analyser.fftSize; ++i) {
      max = Math.max(this.array[i], max)
    }
    return max / 255 * 2
  }

  toggleThumb (showThumb) {
    this.wrapper.style.display = showThumb ? 'flex' : 'none'
  }
}
