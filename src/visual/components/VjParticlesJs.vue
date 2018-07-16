<template lang="pug">
#particles-js
</template>

<script>
import 'particles.js/particles.js'
import ipc from '../modules/ipc'

function mounted () {
  let pJS

  const actions = {
    initParticlesJs: (configJson) => {
      window.particlesJS(
        'particles-js',
        configJson
      )
      pJS = window.pJSDom[0].pJS

      ipc.send('receive-particles-js', pJS)
    },
    updateParticlesJs: (pJSGui) => {
      Object.assign(pJS, pJSGui)
      pJS.fn.particlesRefresh()
    }
  }

  ipc.on('dispatch-particles-js', (event, typeName, ...payload) => {
    actions[typeName](...payload)
  })
}

export default {
  mounted
}
</script>
