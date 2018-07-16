<template lang="pug">
canvas
</template>

<script>
import brick from './infiniteTubes/brick'
import particles from './infiniteTubes/particles'
import starWars from './infiniteTubes/starWars'
import triangle from './infiniteTubes/triangle'

const demos = {
  brick,
  particles,
  starWars,
  triangle
}

function mounted () {
  const canvas = this.$el

  demos[this.visual.demo](canvas)
}

export default {
  props: ['visual'],
  mounted
}
</script>
