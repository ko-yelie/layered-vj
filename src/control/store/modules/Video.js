import {
  uniqueId
  // merge
} from 'lodash'

import { getUrl } from '../../../modules/url'
import ipc from '../../modules/ipc'
import videoData from '../../assets/json/visual/video.json'
import canvasData from '../../assets/json/visual/canvas.json'
import iframeData from '../../assets/json/visual/iframe.json'
import youtubeData from '../../assets/json/visual/youtube.json'
// import privateVideoData from '../../_assets/json/visual/video.json'
// import privateCanvasData from '../../_assets/json/visual/canvas.json'
// import privateIframeData from '../../_assets/json/visual/iframe.json'
// videoData = videoData.concat(privateVideoData)
// canvasData = canvasData.concat(privateCanvasData)
// iframeData = iframeData.concat(privateIframeData)
// import webcamParticleJson from '../../assets/json/js/webcamParticle/scene.json'
// import webcamParticleLuminous101Json from '../../_assets/json/js/webcamParticle/luminous101.json'

const visualWebcam = [
  {
    type: 'webcamParticle',
    title: 'Webcam x Particle',
    gui: 'webcamParticle',
    thumbnail: getUrl('/assets/thumbnail/webcam-particle.gif'),
    opacity: 1
  }
]
// const visualWebcam = [
//   {
//     title: 'Luminous 101',
//     type: 'webcamParticle',
//     gui: 'webcamParticle',
//     thumbnail: '/_assets/thumbnail/luminous101.jpg',
//     config: merge(
//       {},
//       webcamParticleLuminous101Json,
//       webcamParticleJson
//     ),
//     opacity: 1
//   }
// ]

const visualStock = {
  video: videoData.map(visualData => {
    visualData.url = getUrl(visualData.url)
    visualData.thumbnail = getUrl(visualData.thumbnail)
    return Object.assign(visualData, {
      type: 'videoTag',
      opacity: visualData.opacity || 1
    })
  }),
  canvas: canvasData.map(visualData => {
    visualData.thumbnail = getUrl(visualData.thumbnail)
    return Object.assign(visualData, {
      opacity: visualData.opacity || 1
    })
  }),
  iframe: iframeData.map(visualData => {
    visualData.url = getUrl(visualData.url)
    visualData.thumbnail = getUrl(visualData.thumbnail)
    return Object.assign(visualData, {
      type: 'iframeTag',
      opacity: visualData.opacity || 1
    })
  }),
  YouTube: youtubeData.map(visualData => {
    visualData.url = getUrl(visualData.url)
    visualData.thumbnail = getUrl(visualData.thumbnail)
    return Object.assign(visualData, {
      type: 'iframeTag',
      opacity: visualData.opacity || 1
    })
  })
}

const visualBlank = [
  {
    type: 'iframeTag',
    url: '/src/visual/assets/iframe/blank/',
    title: 'blank',
    thumbnail: '/assets/thumbnail/blank.png',
    opacity: 1
  }
]

function dispatchToVisual (typeName, ...payload) {
  ipc.send('dispatch-connect', typeName, ...payload)
}

export default {
  state: {
    visualWebcam,
    visualBlank,
    visualStock,
    displayingVideos: []
  },
  mutations: {
    UPDATE_VIDEOS (state, visualStock) {
      state.visualStock = visualStock
    },
    UPDATE_DISPLAYING_VIDEOS (state, displayingVideos) {
      state.displayingVideos = displayingVideos
    },
    ADD_DISPLAYING_VIDEO (state, { video, copyVideo }) {
      state.displayingVideos.splice(state.displayingVideos.indexOf(video), 1, copyVideo)
    },
    UPDATE_OPACITY (state, { video, opacity }) {
      video.opacity = opacity
    },
    REMOVE_DISPLAYING_VIDEO (state, video) {
      state.displayingVideos.splice(state.displayingVideos.indexOf(video), 1)
    }
  },
  actions: {
    updateVideos ({ commit }, videos) {
      commit('UPDATE_VIDEOS', videos)
    },
    updateDisplayingVideos ({ commit, state }, displayingVideos) {
      commit('UPDATE_DISPLAYING_VIDEOS', displayingVideos)
    },
    changeDisplayingVideos ({ commit, dispatch }, { added, moved }) {
      if (added) {
        dispatch('addDisplayingVideo', added.element)
      } else if (moved) {
        dispatch('updateDisplayingVideosOrder')
      }
    },
    addDisplayingVideo ({ commit, dispatch }, video) {
      const id = uniqueId()
      const copyVideo = Object.assign({ id }, video)
      commit('ADD_DISPLAYING_VIDEO', { video, copyVideo })

      dispatchToVisual('addDisplayingVideo', copyVideo)
      dispatch('updateDisplayingVideosOrder')
    },
    updateDisplayingVideosOrder ({ commit, state }) {
      dispatchToVisual('updateDisplayingVideosOrder', state.displayingVideos)
    },
    updateOpacity ({ commit }, payload) {
      commit('UPDATE_OPACITY', payload)

      dispatchToVisual('updateOpacity', payload.video)
    },
    removeDisplayingVideo ({ commit }, video) {
      commit('REMOVE_DISPLAYING_VIDEO', video)

      dispatchToVisual('removeDisplayingVideo', video)
    },
    refresh () {
      // dispatchToVisual('refresh')
      location.reload()
    }
  }
}
