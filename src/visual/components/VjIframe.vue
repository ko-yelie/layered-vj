<template lang="pug">
iframe(
  :src="visual.url",
  frameborder="0",
  allowfullscreen=""
)
</template>

<script>
export default {
  props: ['visual']
}
</script>

<style scoped lang="scss">
.visual {
  left: 50%;
  width: calc(100vh * #{(640 / 360)});
  transform: translateX(-50%);
}
</style>
