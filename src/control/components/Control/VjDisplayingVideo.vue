<template lang="pug">
md-card
  md-card-media-cover(md-solid='')
    md-card-media(md-ratio='16:9')
      img(:src="video.thumbnail", alt="")
    md-card-area
      md-card-header
        .md-title {{ video.title }}
        .md-subhead(v-if="video.copyright")
          a(:href="video.copyrightLink" target="_blank") &copy {{ video.copyright }}
      md-card-actions
        .dv-slider
          range-slider(
            min="0"
            max="1"
            step="0.05"
            v-model="opacity"
            @input="updateOpacity"
          )
          md-tooltip(md-direction="left") opacity
        md-button(@click.native="removeDisplayingVideo") Remove
</template>

<script>
import RangeSlider from 'vue-range-slider'

import webcamParticle from '../gui/webcamParticle.js'
import particlesJsGui from '../gui/particlesJsGui.js'

const loadGUI = {
  webcamParticle,
  particlesJsGui
}

export default {
  props: ['video'],
  data () {
    return {
      opacity: this.video.opacity
    }
  },
  components: {
    RangeSlider
  },
  methods: {
    updateOpacity (opacity) {
      this.$store.dispatch('updateOpacity', {
        video: this.video,
        opacity
      })
    },
    removeDisplayingVideo () {
      this.$store.dispatch('removeDisplayingVideo', this.video)
    }
  },
  mounted () {
    this.video.gui && loadGUI[this.video.gui](this.video.config, this.$store)
  }
}
</script>

<style lang="scss">
$rail-fill-color: #3f51b5;

@import '~vue-range-slider/dist/vue-range-slider.scss';

.md-card {
  width: 100%;
  cursor: -webkit-grab;

  &.sortable-chosen {
    cursor: -webkit-grabbing;
  }

  &-media {
    min-height: 106px;
    background: #000;

    .md-card &.md-16-9:before {
      padding-top: 24%;
    }
  }

  .md-card-header {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .md-title {
    font-size: 14px;
    line-height: 1.33
  }

  .md-theme-default & .md-caption {
    color: currentColor;
  }

  .range-slider {
    vertical-align: top;
  }

  .md-card-actions .md-button {
    opacity: 0.7;
    &:hover {
      opacity: 1;
    }
  }

  .dv-slider {
    margin-right: 10px;
  }
}

.md-card .md-card-media-cover .md-subhead {
  opacity: 0.7;
  color: #fff;
  font-size: 10px;

  a {
    color: currentColor;
    text-decoration: none;
    &:hover {
      color: currentColor;
    }
  }

  &:hover {
    opacity: 1;
  }
}
</style>
