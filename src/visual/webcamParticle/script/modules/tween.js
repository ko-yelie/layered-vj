import * as easingFunctions from 'js-easing-functions'

easingFunctions.linear = (elapsed, initialValue, amountOfChange, duration) => amountOfChange * (elapsed / duration) + initialValue

export default class Tween {
  constructor (target, options) {
    const {
      property,
      from = 0,
      to = 1,
      duration = 1000,
      easing = 'linear'
    } = options

    this.target = target
    this.duration = duration
    this.easing = easing
    this.property = property || Object.keys(target)[0]
    this.originalFrom = from || target[property]
    this.originalTo = to
  }

  tick () {
    const elapsed = Date.now() - this.startTime

    if (elapsed < this.duration) {
      this.target[this.property] = easingFunctions[this.easing](elapsed, this.from, this.to - this.from, this.duration)
      this.id = requestAnimationFrame(() => { this.tick() })
    } else {
      this.target[this.property] = this.to
    }
  }

  animate () {
    this.stop()
    this.startTime = Date.now()
    this.id = requestAnimationFrame(() => { this.tick() })
  }

  play () {
    this.from = this.originalFrom
    this.to = this.originalTo
    this.animate()
  }

  reverse () {
    this.from = this.originalTo
    this.to = this.originalFrom
    this.animate()
  }

  stop () {
    cancelAnimationFrame(this.id)
  }
}
