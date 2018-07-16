export default {
  state: {
    videoZoom: null,
    videoAlpha: null,
    inputAudio: null
  },
  mutations: {
    UPDATE_ZOOM (state, videoZoom) {
      state.videoZoom = videoZoom
    },
    UPDATE_ALPHA (state, videoAlpha) {
      state.videoAlpha = videoAlpha
    },
    UPDATE_INPUT_AUDIO (state, inputAudio) {
      state.inputAudio = inputAudio
    }
  },
  getters: {
    videoZoom: state => () => state.videoZoom,
    videoAlpha: state => () => state.videoAlpha,
    inputAudio: state => () => state.inputAudio
  }
}
