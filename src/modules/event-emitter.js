export default class EventEmitter {
  constructor () {
    this._listeners = {}
  }

  /**
   * Get listeners list
   * @param {string} name - event name
   */
  _get (name) {
    return this._listeners[name] || []
  }

  /**
   * Add event listener
   * @param {string} name - event name
   * @param {function(data: *): void} listener - listener function
   */
  on (name, listener) {
    const list = this._listeners[name] = this._get(name)
    list.push(listener)
  }

  /**
   * Add one-time event listener
   * @param {string} name - event name
   * @param {function(data: *): void} listener - listener function
   */
  once (name, listener) {
    const list = this._listeners[name] = this._get(name)
    const onceListener = (...data) => {
      listener(...data)
      this.off(name)
    }
    list.push(onceListener)
  }

  /**
   * Emit event
   * @param {string} name - event name
   * @param {*} data - data to emit event listeners
   */
  emit (name, ...data) {
    this._get(name).forEach(fn => fn(...data))
  }

  /**
   * Remove event listener
   * @param {string} name - event name
   */
  off (name) {
    delete this._listeners[name]
  }
}
