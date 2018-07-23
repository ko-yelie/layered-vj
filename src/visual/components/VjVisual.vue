<template lang="pug">
div.visual(
  :style="{ 'z-index': order, opacity: visual.opacity }"
  v-if="isShow"
)
  component.visual-content(
    :is="visual.type"
    :visual="visual"
  )
  p.visual-copyright(v-if="visual.copyright") &copy {{ visual.copyright }}
</template>

<script>
import VjIframe from './VjIframe'
import VjVideo from './VjVideo'
import WebcamParticle from './WebcamParticle'
// import VjParticlesJs from './VjParticlesJs'
import VjInfiniteTubes from './VjInfiniteTubes'
import VjDynamicText from './VjDynamicText'
// import VjParticleSandbox from './VjParticleSandbox'

export default {
  props: ['visual', 'order', 'isShow'],
  components: {
    iframeTag: VjIframe,
    videoTag: VjVideo,
    webcamParticle: WebcamParticle,
    // particlesJs: VjParticlesJs,
    infiniteTubes: VjInfiniteTubes,
    dynamicText: VjDynamicText
    // particleSandbox: VjParticleSandbox
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

  &-content {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-copyright {
    opacity: 0.7;
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 1em;
    color: #fff;
    font-size: 10px;
    text-shadow: 0 0 1px rgba(#000000, 0.7), 1px 1px 1px rgba(#000000, 0.4);
  }
}
</style>
