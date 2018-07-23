<template lang="pug">
video(
  :src="visual.url"
  autoplay=""
  loop=""
  muted=""
)
</template>

<script>
export default {
  props: ['visual'],
  mounted () {
    if (this.visual.playbackRate) {
      this.$el.playbackRate = this.visual.playbackRate
    }
  }
}
</script>

<style scoped lang="scss">
.visual {
  background: #000;
}
</style>
