import { getFirstValue } from './utils.js'
import { Webcam } from './webcam.js'

export default class Media {
  constructor (size, pointResolution) {
    this.size = size
    this.pointResolution = pointResolution

    this.video = document.createElement('video')
    this.video.width = this.size
    this.video.height = this.size
    this.video.loop = true
    this.video.muted = true

    this.currentVideo = this.video

    this.videoDevices = {}
    this.videoFiles = {}
    this.audioDevices = {}

    this.audioCtx = new AudioContext()

    this.initWebcam()
    // this.initVideoFiles()
    this.loadSmartphone()
  }

  initWebcam () {
    this.webcam = new Webcam(this.currentVideo)
    // await this.webcam.setup()
    this.webcam.adjustVideoSize(this.currentVideo.videoWidth || this.currentVideo.naturalWidth, this.currentVideo.videoHeight || this.currentVideo.naturalHeight)
  }

  initVideoFiles () {
    ;['live-1-2'].forEach(videoId => {
      const id = `file:${videoId}`
      const video = document.createElement('video')
      video.src = `/src/visual/assets/video/${videoId}.mp4`
      video.width = this.size
      video.height = this.size
      video.loop = true
      video.muted = true
      this.videoDevices[`File: ${videoId}`] = id
      this.videoFiles[id] = video
    })
  }

  // smartphone webcam
  loadSmartphone () {
    const smartphone = document.getElementById('smartphone')
    if (!smartphone) return

    this.smartphone = smartphone
    this.smartphone.width = this.size
    this.smartphone.height = this.size

    this.videoDevices['Smartphone'] = 'smartphone'
  }

  enumerateDevices () {
    return navigator.mediaDevices.enumerateDevices().then(mediaDeviceInfos => {
      // let webcamCount = 0
      const videoDevices = {}
      const audioDevices = {}

      mediaDeviceInfos.forEach(mediaDeviceInfo => {
        switch (mediaDeviceInfo.kind) {
          case 'videoinput':
            videoDevices[mediaDeviceInfo.label.replace(/ \(.+?\)/, '')] = mediaDeviceInfo.deviceId
            // webcamCount++
            break
          case 'audioinput':
            audioDevices[mediaDeviceInfo.label.replace(/ \(.+?\)/, '')] = mediaDeviceInfo.deviceId
            break
        }
      })

      // if (webcamCount > 1) {
      //   delete videoDevices['FaceTime HD Camera']
      // }

      this.videoSource = videoDevices['HD Pro Webcam C920'] || getFirstValue(videoDevices)
      this.audioSource = audioDevices['HD Pro Webcam C920'] || getFirstValue(audioDevices)
      Object.assign(this.videoDevices, videoDevices)
      Object.assign(this.audioDevices, audioDevices)
    })
  }

  getUserMedia (sources = {}) {
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
            this.currentVideo = videoFile
          } else if (smartphoneFile) {
            this.currentVideo = smartphoneFile
          } else {
            this.video.srcObject = stream
            this.currentVideo = this.video
          }

          const source = this.audioCtx.createMediaStreamSource(stream)
          // const source = this.audioCtx.createMediaElementSource(this.currentVideo)
          this.analyser = this.audioCtx.createAnalyser()
          this.analyser.fftSize = this.pointResolution
          source.connect(this.analyser)
          this.array = new Uint8Array(this.analyser.fftSize)

          const playVideo = () => {
            // 複数回呼ばれないようにイベントを削除
            this.currentVideo.removeEventListener('canplay', playVideo)
            // video 再生開始をコール
            this.currentVideo.play()

            this.initWebcam()

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
}
