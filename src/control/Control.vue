<script>
import draggable from 'vuedraggable'
import { mapActions } from 'vuex'

import VjDisplayingVideo from './components/Control/VjDisplayingVideo'
import VjThumb from './components/Control/VjThumb'

let displayingVideosCache = []

export default {
  name: 'control',
  components: {
    draggable,
    VjDisplayingVideo,
    VjThumb
  },
  computed: {
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
  }
}
</script>
<template lang="pug" src="./Control.pug"></template>
<style lang="scss" src="./Control.scss"></style>
