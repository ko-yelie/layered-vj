<template lang="pug">
component.visual(
  :is="visual.type"
  :visual="visual"
  :class="{ 'visual-copyright': visual.copyright }"
  :style="{ 'z-index': order, opacity: visual.opacity }"
  v-if="isShow"
)
</template>

<script>
import VjIframe from './VjIframe'
import VjVideo from './VjVideo'
import WebcamParticle from './WebcamParticle'
import VjParticlesJs from './VjParticlesJs'
import VjInfiniteTubes from './VjInfiniteTubes'
import VjDynamicText from './VjDynamicText'
import VjQuietflow from './VjQuietflow'
import VjParticleSandbox from './VjParticleSandbox'

export default {
  props: ['visual', 'order', 'isShow'],
  components: {
    iframeTag: VjIframe,
    videoTag: VjVideo,
    webcamParticle: WebcamParticle,
    particlesJs: VjParticlesJs,
    infiniteTubes: VjInfiniteTubes,
    dynamicText: VjDynamicText,
    quietflow: VjQuietflow,
    particleSandbox: VjParticleSandbox
  }
}
</script>

<style lang="scss">
.visual {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;

  &-copyright {
    object-fit: cover;
    transform: scale(1.08);
  }
}
</style>
