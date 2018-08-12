import * as easingFunctions from 'js-easing-functions'

easingFunctions.linear = (elapsed, initialValue, amountOfChange, duration) => amountOfChange * (elapsed / duration) + initialValue

export default class Tween {
  constructor (target, options) {
    const {
      property,
      from = 0,
      to = 1,
      duration = 1000,
      easing = 'linear',
      isAuto = true
    } = options

    this.target = target
    this.duration = duration
    this.easingFunction = easingFunctions[easing]
    this.property = property || Object.keys(target)[0]
    this.originalFrom = from || target[property]
    this.originalTo = to

    isAuto && this.play()
  }

  tick (timestamp) {
    const elapsed = Math.min(timestamp - this.startTime, this.duration)

    this.target[this.property] = this.easingFunction(elapsed, this.from, this.diff, this.duration)

    if (elapsed < this.duration) {
      this.id = requestAnimationFrame(this.tick.bind(this))
    }
  }

  animate () {
    this.stop()
    this.id = requestAnimationFrame(timestamp => {
      this.startTime = timestamp
      this.tick(timestamp)
    })
  }

  play () {
    this.from = this.originalFrom
    this.to = this.originalTo
    this.diff = this.to - this.from
    this.animate()
  }

  reverse () {
    this.from = this.originalTo
    this.to = this.originalFrom
    this.diff = this.to - this.from
    this.animate()
  }

  stop () {
    cancelAnimationFrame(this.id)
  }
}
