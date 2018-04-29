import getElements from 'get-elements-array'
import yolo, { downloadModel } from 'tfjs-yolo-tiny'
import { Webcam } from './webcam'

export default class Media {
  constructor(size, pointResolution) {
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
  }

  enumerateDevices() {
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

      getElements('.video').forEach(video => {
        video.width = this.size
        video.height = this.size
        video.loop = true
        video.muted = true
        this.videoDevices[`Video: ${video.innerText}`] = video.src
        this.videoFiles[video.src] = video
      })
    })
  }

  getUserMedia(sources) {
    let videoFile
    if (/^http[s]?:/.test(sources.video)) {
      videoFile = this.videoFiles[sources.video]
    } else {
      this.videoSource = sources.video || this.videoSource
    }
    this.audioSource = sources.audio || this.audioSource

    return new Promise(resolve => {
      // get webcam
      navigator.mediaDevices
        .getUserMedia({
          audio: { deviceId: { exact: this.audioSource } },
          video: { deviceId: { exact: this.videoSource } }
        })
        .then(stream => {
          // on webcam enabled
          if (videoFile) {
            this.currentVideo && (this.currentVideo.style.display = 'none')
            this.currentVideo = videoFile
            videoFile.style.display = 'block'
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

            this.initYolo()

            resolve()
          }

          if (this.currentVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            playVideo()
          } else {
            this.currentVideo.addEventListener('canplay', playVideo)
          }
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
    this.wrapper.style.display = showThumb ? 'flex' : 'none'
  }

  async initYolo() {
    this.webcam = new Webcam(this.currentVideo)
    // await this.webcam.setup()
    this.webcam.adjustVideoSize(this.currentVideo.videoWidth, this.currentVideo.videoHeight)

    this.model = await downloadModel()

    this.isReadyDetect = true
  }

  async detectObjects() {
    this.clearRects()

    const inputImage = this.webcam.capture()

    const boxes = await yolo(inputImage, this.model)
    console.log(boxes)

    boxes.forEach(box => {
      const { top, left, bottom, right, classProb, className } = box
      // if (className !== 'person') return

      this.drawRect(left, top, right - left, bottom - top, `${className} Confidence: ${Math.round(classProb * 100)}%`)
      console.log(left, top, right - left, bottom - top, `${className} ${classProb}`)
    })
  }

  drawRect(x, y, w, h, text = '', color = 'red') {
    const rect = document.createElement('div')
    rect.classList.add('rect')
    rect.style.cssText = `top: ${y}px; left: ${x}px; width: ${w}px; height: ${h}px; border-color: ${color}`

    const label = document.createElement('div')
    label.classList.add('label')
    label.innerText = text
    rect.appendChild(label)

    this.wrapper.appendChild(rect)
  }

  clearRects() {
    const rects = document.getElementsByClassName('rect')
    while (rects[0]) {
      rects[0].parentNode.removeChild(rects[0])
    }
  }
}
