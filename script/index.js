import run from './script.js'

Vue.create = function(options) {
  return new Vue(options)
}

window.addEventListener('load', run)
