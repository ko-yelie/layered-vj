import EventEmitter from '../../modules/event-emitter'

class Ipc extends EventEmitter {
  constructor () {
    super()

    this.openVisual()
  }

  openVisual () {
    this.visualWindow = window.open('visual.html', 'visual')
  }

  on (name, listener) {
    super.on(name, (...args) => {
      listener({}, ...args)
    })
  }

  once (name, listener) {
    super.once(name, (...args) => {
      listener({}, ...args)
    })
  }

  send (channel, ...args) {
    this.emit(channel, ...args)
  }
}

window.ipc = new Ipc()

export default window.ipc
