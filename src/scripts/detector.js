import yolo, { downloadModel } from 'tfjs-yolo-tiny'

let storedModel

export default class Detector {
  constructor (webcam, wrapper) {
    this.webcam = webcam
    this.video = webcam.webcamElement
    this.wrapper = wrapper

    this.size = Math.min(this.video.width, this.video.height)
    this.diff = (this.video.width - this.size) / 2

    if (storedModel) {
      this.promise = Promise.resolve()
      this.isReady = true
    } else {
      this.promise = downloadModel().then(model => {
        storedModel = model
        this.isReady = true
      })
    }
  }

  async detect () {
    if (!this.isReady) return

    this.reset()

    const inputImage = this.webcam.capture()

    const boxes = await yolo(inputImage, storedModel)
    boxes.forEach(box => {
      const { top, left, bottom, right, classProb, className } = box
      if (className !== 'person') return

      this.posList.push([top / this.size, this.convert(left), bottom / this.size, this.convert(right)])
      this.drawRect(
        left,
        top,
        right - left,
        bottom - top,
        `${Math.round(classProb * 100)}%`,
        this.posList.length > 4 ? 'blue' : 'red'
      )
    })
  }

  convert (val) {
    return (val + this.diff) / this.video.width
  }

  drawRect (x, y, w, h, text = '', color = 'red') {
    const rect = document.createElement('div')
    rect.classList.add('rect')
    color === 'blue' && rect.classList.add('o-blue')
    rect.style.cssText = `top: ${y}px; left: ${x}px; width: ${w}px; height: ${h}px;`

    const label = document.createElement('div')
    label.classList.add('label')
    label.innerText = text
    rect.appendChild(label)

    this.wrapper.appendChild(rect)
  }

  clearRects () {
    const rects = document.getElementsByClassName('rect')
    while (rects[0]) {
      rects[0].parentNode.removeChild(rects[0])
    }
  }

  reset () {
    this.clearRects()
    this.posList = []
  }
}
