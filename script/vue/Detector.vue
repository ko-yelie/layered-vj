<template lang="pug">
.detector(v-if="isShow")
  p.progress(v-if='!isReady') Loading model...
  p.done(v-else) Click to detect!
</template>

<script>
export default {
  name: 'detector',
  props: ['isShow', 'isReady']
}
</script>

<style lang="stylus" scoped>
.detector
  position absolute
  right 0
  bottom 0
  color #ddd

p
  margin 1em

.progress
  animation loading 1000ms infinite

@keyframes loading
  0%
    opacity 1
  50%
    opacity 0
  100%
    opacity 1
</style>
