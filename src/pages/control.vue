<template lang="pug" src="../control/Control.pug"></template>

<script>
import draggable from 'vuedraggable'
import { mapActions } from 'vuex'

import VjDisplayingVideo from '../control/components/Control/VjDisplayingVideo'
import VjThumb from '../control/components/Control/VjThumb'
import ipc from '../control/modules/ipc'

let displayingVideosCache = []

export default {
  name: 'control',
  components: {
    draggable,
    VjDisplayingVideo,
    VjThumb
  },
  computed: {
    visualWebcam () {
      return this.$store.state.Video.visualWebcam
    },
    visualBlank () {
      return this.$store.state.Video.visualBlank
    },
    visualStock: {
      get () {
        return this.$store.state.Video.visualStock
      },
      set (visualStock) {
        this.$store.dispatch('updateVideos', visualStock)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (displayingVideos) {
        displayingVideosCache = displayingVideos
      }
    }
  },
  methods: {
    changeDisplayingVideos (evt) {
      this.$store.dispatch('updateDisplayingVideos', displayingVideosCache)
      this.$store.dispatch('changeDisplayingVideos', evt)
    },
    ...mapActions([
      'refresh'
    ])
  },
  mounted () {
    ipc.openVisual()
  }
}
</script>

<style lang="scss" src="../control/Control.scss"></style>
