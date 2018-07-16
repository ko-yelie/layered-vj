<template lang="pug">
.thumb(v-show="isShow", :style="elStyle")
  .thumb_wrapper(ref="wrapper", :style="wrapperStyle")
    .thumb_scope(ref="scope", :style="scopeStyle")

  .rect_wrapper(ref="rectWrapper", :style="rectWrapperStyle")
  .detector(v-show="isShowDetectorMessage")
    p.progress(v-if='!isReady') Loading model...
    p.done(v-else) Click to detect!
</template>

<script>
import dat from 'dat.gui'

import ipc from '../../modules/ipc'
import {
  getFirstValue,
  clamp
} from '../../../visual/webcamParticle/script/modules/utils.js'
import Media from '../../../visual/webcamParticle/script/modules/media.js'
import {
  VIDEO_RESOLUTION,
  POINT_RESOLUTION,
  MIN_VIDEO_ZOOM,
  MAX_VIDEO_ZOOM
} from '../../../visual/webcamParticle/script/modules/constant.js'
import Detector from '../../../visual/webcamParticle/script/modules/detector.js'
import json from '../../assets/json/js/webcamParticle/scene.json'

const THUMB_HEIGHT = 416
const INITIAL_VIDEO_ZOOM = 1

class ControlMedia extends Media {
  constructor (size, pointResolution, media) {
    super(size, pointResolution)

    ;[
      'videoDevices',
      'audioDevices',
      'videoSource',
      'audioSource',
      'smartphone'
    ].forEach(key => {
      this[key] = media[key]
    })
  }
}

export default {
  data: () => ({
    isShow: false,
    isShowDetectorMessage: false,
    isReady: false,
    video: {
      videoWidth: 1,
      videoHeight: 1
    },
    videoZoom: INITIAL_VIDEO_ZOOM,
    scopePos: {
      width: 0,
      height: 0,
      x: 0,
      y: 0
    },
    windowSize: {
      width: 1,
      height: 1
    },
    maxSize: {
      width: 1,
      height: 1
    }
  }),
  computed: {
    elStyle () {
      return {
        height: THUMB_HEIGHT + 'px'
      }
    },
    wrapperSize () {
      return this.containSize({
        width: this.video.videoWidth,
        height: this.video.videoHeight
      }, this.maxSize)
    },
    wrapperStyle () {
      const wrapperSize = this.wrapperSize
      return {
        width: wrapperSize.width + 'px',
        height: wrapperSize.height + 'px'
      }
    },
    scopeSize () {
      const size = this.containSize(this.windowSize, this.wrapperSize)
      const scale = 1 / this.videoZoom
      return {
        width: size.width * scale,
        height: size.height * scale
      }
    },
    scopeStyle () {
      const scopeSize = this.scopeSize
      return {
        width: scopeSize.width + 'px',
        height: scopeSize.height + 'px',
        top: this.scopePos.y + 'px',
        left: this.scopePos.x + 'px'
      }
    },
    rectWrapperStyle () {
      return {
        width: THUMB_HEIGHT + 'px',
        height: THUMB_HEIGHT + 'px'
      }
    }
  },
  methods: {
    containSize (inputResolution, outputResolution) {
      const inputRatio = inputResolution.width / inputResolution.height
      const outputRatio = outputResolution.width / outputResolution.height
      let width, height
      if (inputRatio >= outputRatio) {
        width = outputResolution.width
        height = inputResolution.height * (outputResolution.width / inputResolution.width)
      } else {
        height = outputResolution.height
        width = inputResolution.width * (outputResolution.height / inputResolution.height)
      }
      return { width, height }
    }
  },
  mounted () {
    ipc.on('receive-media', async (event, media) => {
      const updateMedia = async (sources) => {
        await controlMedia.getUserMedia(sources)

        // add thumbnail
        this.video.videoWidth > 1 && this.$refs.wrapper.removeChild(this.video)
        this.video = controlMedia.currentVideo
        this.video.classList.add('thumb_video')
        this.$refs.wrapper.appendChild(this.video)
        this.video.play()
      }

      // init thumbnail
      const controlMedia = new ControlMedia(VIDEO_RESOLUTION, POINT_RESOLUTION, media)
      await updateMedia()

      // init gui
      const config = json
      const preset = config.preset
      const gui = new dat.GUI({
        load: config,
        preset: preset
      })
      const settings = config.remembered[preset][0]

      // video folder
      {
        const videoFolder = gui.addFolder('video')
        videoFolder.open()

        // video
        settings.video = controlMedia.videoSource
        const videoController = videoFolder.add(settings, 'video', controlMedia.videoDevices).onChange(dispatchMedia)
        if (!Object.keys(controlMedia.videoDevices).some(key => settings.video === controlMedia.videoDevices[key])) {
          videoController.setValue(getFirstValue(controlMedia.videoDevices))
        }

        // videoZoom
        const videoZoomMap = [MIN_VIDEO_ZOOM, MAX_VIDEO_ZOOM]
        videoFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia).listen()

        // videoAlpha
        const videoAlphaMap = [0, 1]
        videoFolder.add(settings, 'videoAlpha', ...videoAlphaMap).onChange(dispatchMedia).listen()

        // thumb
        settings.thumb = true
        videoFolder.add(settings, 'thumb').onChange(dispatchMedia)
        this.isShow = settings.thumb

        // Detector folder
        {
          const detectorFolder = videoFolder.addFolder('Detector')
          detectorFolder.open()

          // detector
          detectorFolder.add(settings, 'detector').onChange(dispatchMedia)

          // detect
          settings.detect = () => {}
          detectorFolder.add(settings, 'detect').onChange(dispatchMedia)
        }
      }

      // audio folder
      {
        const audioFolder = gui.addFolder('audio')
        audioFolder.open()

        // inputAudio
        audioFolder.add(settings, 'inputAudio').onChange(dispatchMedia).listen()

        // audio
        settings.audio = controlMedia.audioSource
        const audioController = audioFolder.add(settings, 'audio', controlMedia.audioDevices).onChange(dispatchMedia)
        if (!Object.keys(controlMedia.audioDevices).some(key => settings.audio === controlMedia.audioDevices[key])) {
          audioController.setValue(getFirstValue(controlMedia.audioDevices))
        }
      }

      const self = this
      async function dispatchMedia (value, property) {
        property = property || this.property

        switch (property) {
          case 'video':
            await updateMedia({
              video: value
            })
            ipc.send('dispatch-media', 'detect', resetDetector())
            ipc.send('dispatch-media', 'detect', await detect())
            break
          case 'audio':
            updateMedia({
              audio: value
            })
            break
          case 'videoZoom':
            const width = self.scopeSize.width
            const height = self.scopeSize.height
            scopePos = self.scopePos
            scopeSize = self.scopeSize
            self.videoZoom = value
            scopePos.x += (width - scopeSize.width) / 2
            scopePos.y += (height - scopeSize.height) / 2
            if (isWheel) {
              isWheel = false
            } else {
              setScopePos()
            }
            break
          case 'thumb':
            self.isShow = value
            break
          case 'detector':
            ipc.send('dispatch-media', 'detect', value ? await runDetector() : resetDetector())
            break
          case 'detect':
            value = await detect()
            break
        }

        ipc.send('dispatch-media', property, value)
      }

      const runDetector = async () => {
        this.isShowDetectorMessage = true
        resetDetector()
        this.detector = new Detector(controlMedia.webcam, this.$refs.rectWrapper)
        await this.detector.promise
        this.isReady = true
        return detect()
      }

      const detect = async () => {
        if (!settings.detector || !this.detector) return []

        await this.detector.detect()
        return this.detector.posList
      }

      const resetDetector = () => {
        if (!this.detector) return []

        this.detector.reset()
        this.isReady = false
        this.isShowDetectorMessage = false
        return this.detector.posList
      }

      ;[
        'videoZoom',
        'videoAlpha',
        'inputAudio'
      ].forEach(property => {
        this.$store.watch(this.$store.getters[property], value => {
          settings[property] = value
          dispatchMedia(value, property)
        })
      })

      // pointer
      let isDown = false
      let isWheel = false
      let scopePos
      let wrapperSize
      let scopeSize
      const setScopePos = (x, y) => {
        scopePos = this.scopePos
        wrapperSize = this.wrapperSize
        scopeSize = this.scopeSize

        if (x === void 0) x = scopePos.x + scopeSize.width / 2
        if (y === void 0) y = scopePos.y + scopeSize.height / 2

        scopePos.x = clamp(
          x - scopeSize.width / 2,
          0,
          wrapperSize.width - scopeSize.width
        )
        scopePos.y = clamp(
          y - scopeSize.height / 2,
          0,
          wrapperSize.height - scopeSize.height
        )

        ipc.send('dispatch-media', 'zoomPos', [
          (scopePos.x + scopeSize.width / 2) / wrapperSize.width * 2.0 - 1.0,
          (scopePos.y + scopeSize.height / 2) / wrapperSize.height * 2.0 - 1.0
        ])
      }
      this.$refs.wrapper.addEventListener('pointerdown', e => {
        isDown = true
        setScopePos(e.offsetX, e.offsetY)
      })
      this.$refs.wrapper.addEventListener('pointermove', e => {
        if (!isDown) return

        setScopePos(e.offsetX, e.offsetY)
      })
      this.$refs.wrapper.addEventListener('pointerup', e => {
        isDown = false
      })

      this.$refs.wrapper.addEventListener('wheel', e => {
        isWheel = true
        settings.videoZoom = clamp(settings.videoZoom - e.deltaY * 0.001, MIN_VIDEO_ZOOM, MAX_VIDEO_ZOOM)
        setScopePos(e.offsetX, e.offsetY)
        dispatchMedia(settings.videoZoom, 'videoZoom')
      })

      setTimeout(() => {
        this.maxSize.width = this.$el.clientWidth
        this.maxSize.height = THUMB_HEIGHT

        wrapperSize = this.wrapperSize
        scopeSize = this.scopeSize
        this.scopePos = {
          y: (wrapperSize.height - scopeSize.height) / 2,
          x: (wrapperSize.width - scopeSize.width) / 2
        }
      }, 0)
    })

    // window size
    ipc.on('receive-window', (event, windowSize) => {
      this.windowSize = windowSize

      this.scopePos = {
        y: (this.wrapperSize.height - this.scopeSize.height) / 2,
        x: (this.wrapperSize.width - this.scopeSize.width) / 2
      }
    })
  }
}
</script>

<style lang="scss">
.thumb {
  overflow: hidden;
  position: relative;
  background-color: #000;

  &_wrapper {
    position: relative;
    margin: auto;
  }

  &_scope {
    position: absolute;
    top: 0;
    left: 0;
    border: dashed 2px rgba(white, 0.6);
  }

  &_video:not(.md-image) {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.rect {
  position: absolute;
  z-index: 1;
  border: 1px solid red;
  font-size: 24px;

  &_wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    border: dotted 1px rgba(white, 0.3);
    pointer-events: none;
  }

  .label {
    position: absolute;
    right: 0;
    bottom: 0;
    background: rgba(white, 0.4);
    color: #333;
    font-size: 10px;
    padding: 0 2px;
    text-transform: capitalize;
    white-space: nowrap;
  }

  &.o-blue {
    opacity: 0.5;
    z-index: auto;
    border-color: blue;
  }
}

.detector {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #ddd;

  p {
    margin: 1em;
  }
}
.progress {
  animation: loading 1000ms infinite;
}
@keyframes loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
