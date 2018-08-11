import dat from 'dat.gui'

import ipc from '../../modules/ipc'
import json from '../../assets/json/js/webcamParticle/scene.json'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  MODE_LIST,
  POST_LIST,
  DEFORMATION_LIST
} from '../../../visual/webcamParticle/script/modules/constant.js'

export default async function (argConfig, store) {
  const config = argConfig || json
  const preset = location.search.substring(1) || config.preset
  const gui = new dat.GUI({
    load: config,
    preset: preset
  })
  let pointFolder
  let bgColorController
  let deformationMap
  let autoDeformationTimer

  const settings = config.remembered[preset][0]
  gui.remember(settings)

  // Post Effect folder
  {
    const postFolder = gui.addFolder('Post Effect')
    postFolder.open()

    // effect
    const effectMap = POST_LIST
    postFolder.add(settings, 'effect', effectMap).onChange(dispatchVisual)
    postFolder.add(settings, 'effect2', effectMap).onChange(dispatchVisual)
    postFolder.add(settings, 'lastEffect', effectMap).onChange(dispatchVisual)

    // custom value
    const customMap = [0, 1]
    postFolder.add(settings, 'custom', ...customMap).onChange(dispatchVisual)

    // custom switch
    postFolder.add(settings, 'customSwitch').onChange(dispatchVisual)
  }

  // Particle folder
  {
    const particleFolder = gui.addFolder('Particle')

    // animation
    const animationMap = ['none', 'normal', 'warp', 'pop']
    particleFolder.add(settings, 'animation', animationMap).onChange(dispatchVisual)

    // mode
    const modeMap = MODE_LIST
    particleFolder.add(settings, 'mode', modeMap).onChange(dispatchVisual)

    // point folder
    pointFolder = particleFolder.addFolder('gl.POINTS')

    // pointShape
    const pointShapeMap = { square: 0, circle: 1, star: 2, video: 3 }
    pointFolder.add(settings, 'pointShape', pointShapeMap).onChange(dispatchVisual)

    // pointSize
    const pointSizeMap = [0.1, 30]
    pointFolder.add(settings, 'pointSize', ...pointSizeMap).onChange(dispatchVisual)

    // deformation
    deformationMap = {}
    let deformationList = DEFORMATION_LIST
    if (argConfig && argConfig.deformation) {
      deformationList = deformationList.concat(argConfig.deformation)
    }
    deformationList.forEach(({ key, value }) => {
      deformationMap[key] = value
    })
    particleFolder.add(settings, 'deformation', deformationMap).onChange(dispatchVisual).listen()

    // changeDeformation
    settings.changeDeformation = () => {
      const array = Object.keys(deformationMap)
      array.some((v, i) => {
        if (deformationMap[v] === settings.deformation) array.splice(i, 1)
      })
      settings.deformation = deformationMap[array[Math.floor(Math.random() * array.length)]]
      ipc.send('dispatch-webcam-particle', 'update', 'deformation', settings.deformation)
    }
    particleFolder.add(settings, 'changeDeformation').onChange(dispatchVisual)

    // autoDeformation
    particleFolder.add(settings, 'autoDeformation').onChange(dispatchVisual)

    // canvas folder
    const canvasFolder = particleFolder.addFolder('canvas')

    // bgColor
    const bgColorMap = { black: 0, white: 1 }
    bgColorController = canvasFolder.add(settings, 'bgColor', bgColorMap).onChange(dispatchVisual)

    // z position
    const zPositionMap = [MIN_ZOOM, MAX_ZOOM]
    canvasFolder.add(settings, 'zPosition', ...zPositionMap).listen().onChange(dispatchVisual)

    // pointer
    canvasFolder.add(settings, 'pointer').onChange(dispatchVisual)

    // accel
    canvasFolder.add(settings, 'accel').onChange(dispatchVisual)

    // rotation
    canvasFolder.add(settings, 'rotation').listen().onChange(dispatchVisual)

    // video folder
    const videoFolder = particleFolder.addFolder('video')

    // capture
    videoFolder.add(settings, 'capture').onChange(dispatchVisual)

    // stopMotion
    videoFolder.add(settings, 'stopMotion').onChange(dispatchVisual)

    // particleAlpha
    const particleAlphaMap = [0, 1]
    particleFolder.add(settings, 'particleAlpha', ...particleAlphaMap).onChange(dispatchVisual).listen()
  }

  function dispatchVisual (val) {
    ipc.send('dispatch-webcam-particle', 'update', this.property, val)

    switch (this.property) {
      case 'animation':
        switch (val) {
          case 'normal':
          case 'warp':
          case 'pop':
            settings.particleAlpha = 1
            break
          case 'none':
          default:
            settings.particleAlpha = 0
            settings.videoAlpha = 1
        }
        if (val === 'pop') {
          bgColorController.setValue(1)
        }

        ipc.send('dispatch-webcam-particle', 'update', 'particleAlpha', settings.particleAlpha)
        ipc.send('dispatch-webcam-particle', 'update', 'videoAlpha', settings.videoAlpha)
        store.commit('UPDATE_ALPHA', settings.videoAlpha)
        break
      case 'mode':
        pointFolder.close()

        switch (val) {
          case 'POINTS':
            pointFolder.open()
        }
        break
      case 'autoDeformation':
        if (settings.autoDeformation) {
          autoDeformationTimer = setInterval(settings.changeDeformation, 1000)
        } else {
          clearTimeout(autoDeformationTimer)
        }
        break
    }
  }

  // media folder
  {
    const mediaFolder = gui.addFolder('media')

    // videoZoom
    const videoZoomMap = [1, 3]
    mediaFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia)

    // videoAlpha
    const videoAlphaMap = [0, 1]
    mediaFolder.add(settings, 'videoAlpha', ...videoAlphaMap).onChange(dispatchMedia)

    // inputAudio
    mediaFolder.add(settings, 'inputAudio').onChange(dispatchMedia)
  }

  function dispatchMedia (value) {
    switch (this.property) {
      case 'videoZoom':
        store.commit('UPDATE_ZOOM', settings.videoZoom)
        break
      case 'videoAlpha':
        store.commit('UPDATE_ALPHA', settings.videoAlpha)
        break
      case 'inputAudio':
        store.commit('UPDATE_INPUT_AUDIO', settings.inputAudio)
        break
    }
  }

  ipc.send('dispatch-webcam-particle', 'init', Object.assign({}, settings))
}
