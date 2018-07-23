class Ipc {
  constructor () {
    if (!this.hasControl()) return

    this.controlIpc = window.opener.ipc
  }

  hasControl () {
    if (!window.opener || window.opener.closed) {
      alert('The control window does not exist.')
      return false
    }
    return true
  }

  on (channel, listener) {
    if (!this.hasControl()) return

    this.controlIpc.on(channel, listener)
  }

  send (channel, ...args) {
    if (!this.hasControl()) return

    this.controlIpc.emit(channel, ...args)
  }
}

window.ipc = new Ipc()

export default window.ipc
