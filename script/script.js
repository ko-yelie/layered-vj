import MatIV from './minMatrix.js'
import {
  initWebGL,
  initSize,
  createShader,
  Program,
  createVbo,
  createIbo,
  createTexture,
  bindTexture,
  useProgram,
  bindFramebuffer,
  clearColor
} from './gl-utils.js'
import { setGl, createFramebuffer, createFramebufferFloat, getWebGLExtensions } from './doxas-utils.js'
import { getFirstValue } from './utils.js'
import Media from './media.js'
import { Webcam } from './webcam.js'
import Detector from './detector.js'
import DetectorMessage from './vue/DetectorMessage.vue'

const POINT_RESOLUTION = window.innerWidth < 1000 ? 64 : 128
const VIDEO_RESOLUTION = 416
const S_WIDTH = 256
const T_HEIGHT = 256

let canvas
let canvasWidth
let canvasHeight
let gl
let ext
let isRun
let mat
let mouse = [0.0, 0.0]
let rotation = [0.0, 0.0]

let pointVBO
let meshPointVBO
let planeIndex
let planeVBO
let planeIBO
let mMatrix
let vMatrix
let pMatrix
let vpMatrix
let mvpMatrix
let videoFramebuffers
let pictureFramebuffers
let velocityFramebuffers
let positionFramebuffers
let sceneFramebuffer
let videoBufferIndex
let pictureBufferIndex
let velocityBufferIndex
let positionBufferIndex
let sceneBufferIndex

let videoPrg
let picturePrg
let resetPrg
let positionPrg
let velocityPrg
let scenePrg
let videoScenePrg
let currentPostPrg
let postNonePrg
let postGlitchPrg
let postYkobGlitchPrg
let postDotPrg
let postDotScreenPrg

let render
let media
let webcam
let data = {}
let video
let detector
let detectorMessage
let vbo
let arrayLength
let isStop = 0
let isCapture = false
let isAudio = 0
let defaultFocus = [0, 0, 1, 1]

export default function run() {
  // canvas element を取得しサイズをウィンドウサイズに設定
  const obj = initWebGL(document.getElementById('canvas'))
  canvas = obj.canvas
  gl = obj.gl

  initSize({
    onResize() {
      canvasWidth = canvas.width
      canvasHeight = canvas.height

      updateCamera()

      sceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
      gl.activeTexture(gl.TEXTURE0 + sceneBufferIndex)
      gl.bindTexture(gl.TEXTURE_2D, sceneFramebuffer.texture)
    }
  })

  canvasWidth = canvas.width
  canvasHeight = canvas.height

  setGl(gl)

  mat = new MatIV()
  // matrix
  mMatrix = mat.identity(mat.create())
  vMatrix = mat.identity(mat.create())
  pMatrix = mat.identity(mat.create())
  vpMatrix = mat.identity(mat.create())
  mvpMatrix = mat.identity(mat.create())

  // 拡張機能を有効化
  ext = getWebGLExtensions()

  // Esc キーで実行を止められるようにイベントを設定
  window.addEventListener('keydown', e => {
    if (e.keyCode === 27) {
      isRun = !isRun
      isRun && render()
    }
  })

  let timer
  canvas.addEventListener('mousemove', e => {
    if (!data.mouse) return

    let x = e.clientX / canvasWidth * 2.0 - 1.0
    let y = e.clientY / canvasHeight * 2.0 - 1.0
    mouse = [x, -y]

    clearTimeout(timer)
    canvas.classList.add('s-move')
    timer = setTimeout(() => {
      canvas.classList.remove('s-move')
    }, 500)
  })

  canvas.addEventListener('click', e => {
    if (data.capture) {
      isCapture = true
    }

    if (data.detector && detector) {
      detector.detect()
    }
  })

  // 外部ファイルのシェーダのソースを取得しプログラムオブジェクトを生成
  const noneVs = createShader(require('../shader/nothing.vert'), 'vertex')
  {
    const fs = createShader(require('../shader/video.frag'), 'fragment')
    videoPrg = new Program(noneVs, fs)
    if (!videoPrg) return
  }
  {
    const fs = createShader(require('../shader/picture.frag'), 'fragment')
    picturePrg = new Program(noneVs, fs)
    if (!picturePrg) return
  }
  {
    const fs = createShader(require('../shader/reset.frag'), 'fragment')
    resetPrg = new Program(noneVs, fs)
    if (!resetPrg) return
  }
  {
    const fs = createShader(require('../shader/position.frag'), 'fragment')
    positionPrg = new Program(noneVs, fs)
    if (!positionPrg) return
  }
  {
    const fs = createShader(require('../shader/velocity.frag'), 'fragment')
    velocityPrg = new Program(noneVs, fs)
    if (!velocityPrg) return
  }
  {
    const vs = createShader(require('../shader/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/scene.frag'), 'fragment')
    scenePrg = new Program(vs, fs)
    if (!scenePrg) return
  }

  const postVs = createShader(require('../shader/post/post.vert'), 'vertex')
  {
    const fs = createShader(require('../shader/video_scene.frag'), 'fragment')
    videoScenePrg = new Program(noneVs, fs)
    if (!videoScenePrg) return
  }
  {
    const fs = createShader(require('../shader/post/none.frag'), 'fragment')
    postNonePrg = new Program(postVs, fs)
    if (!postNonePrg) return
  }
  {
    const fs = createShader(require('../shader/post/glitch.frag'), 'fragment')
    postGlitchPrg = new Program(postVs, fs)
    if (!postGlitchPrg) return
  }
  {
    const fs = createShader(require('../shader/post/ykobGlitch.frag'), 'fragment')
    postYkobGlitchPrg = new Program(postVs, fs)
    if (!postYkobGlitchPrg) return
  }
  {
    const fs = createShader(require('../shader/post/dot.frag'), 'fragment')
    postDotPrg = new Program(postVs, fs)
    if (!postDotPrg) return
  }
  {
    const fs = createShader(require('../shader/post/DotScreen.frag'), 'fragment')
    postDotScreenPrg = new Program(postVs, fs)
    if (!postDotScreenPrg) return
  }

  initGlsl()
}

function initGlsl() {
  const sInterval = S_WIDTH / POINT_RESOLUTION / S_WIDTH
  const tInterval = T_HEIGHT / POINT_RESOLUTION / T_HEIGHT

  let pointTexCoord = []
  for (let t = 0; t < 1; t += tInterval) {
    const back = t % (tInterval * 2) === tInterval
    for (let s = 0; s < 1; s += sInterval) {
      const cS = (back ? 1 : 0) + s * (back ? -1 : 1)
      pointTexCoord.push(cS, t, Math.random())
    }
  }
  pointVBO = createVbo(pointTexCoord)

  pointTexCoord = []
  for (let t = 0; t < 1 - tInterval; t += tInterval) {
    for (let s = 0; s < 1; s += sInterval) {
      if (s === S_WIDTH - sInterval) {
        pointTexCoord.push(s, t, Math.random())
        pointTexCoord.push(s, t + tInterval, Math.random())
      } else {
        pointTexCoord.push(s, t, Math.random())
        pointTexCoord.push(s, t + tInterval, Math.random())
        pointTexCoord.push(s + sInterval, t + tInterval, Math.random())
        pointTexCoord.push(s, t, Math.random())
      }
    }
  }
  meshPointVBO = createVbo(pointTexCoord)

  // vertices
  let planeCoord = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]
  planeIndex = [0, 1, 2, 2, 1, 3]
  planeVBO = createVbo(planeCoord)
  planeIBO = createIbo(planeIndex)

  const planeAttribute = {
    position: {
      stride: 3,
      vbo: planeVBO,
      ibo: planeIBO
    }
  }

  videoPrg.createAttribute(planeAttribute)
  videoPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoResolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    },
    zoom: {
      type: '1f'
    }
  })

  picturePrg.createAttribute(planeAttribute)
  picturePrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    },
    prevVideoTexture: {
      type: '1i'
    },
    prevPictureTexture: {
      type: '1i'
    }
  })

  resetPrg.createAttribute(planeAttribute)
  resetPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    }
  })

  velocityPrg.createAttribute(planeAttribute)
  velocityPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevVelocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    },
    mouse: {
      type: '2fv'
    }
  })

  positionPrg.createAttribute(planeAttribute)
  positionPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevPositionTexture: {
      type: '1i'
    },
    velocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    }
  })

  scenePrg.createAttribute({
    data: {
      stride: 3,
      vbo: pointVBO
    }
  })
  scenePrg.createUniform({
    mvpMatrix: {
      type: 'Matrix4fv'
    },
    pointSize: {
      type: '1f'
    },
    videoTexture: {
      type: '1i'
    },
    positionTexture: {
      type: '1i'
    },
    bgColor: {
      type: '1f'
    },
    volume: {
      type: '1f'
    },
    capturedVideoTexture: {
      type: '1i'
    },
    capturedPositionTexture: {
      type: '1i'
    },
    isStop: {
      type: '1f'
    },
    isAudio: {
      type: '1f'
    },
    mode: {
      type: '1f'
    },
    pointShape: {
      type: '1f'
    },
    deformationProgress: {
      type: '1f'
    },
    loopCount: {
      type: '1f'
    }
  })

  videoScenePrg.createAttribute(planeAttribute)
  videoScenePrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoResolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    },
    zoom: {
      type: '1f'
    },
    focusCount: {
      type: '1f'
    },
    focusPos1: {
      type: '4fv'
    },
    focusPos2: {
      type: '4fv'
    },
    focusPos3: {
      type: '4fv'
    },
    focusPos4: {
      type: '4fv'
    }
  })

  function setPostVariables(prg) {
    prg.createAttribute(planeAttribute)
    prg.createUniform({
      resolution: {
        type: '2fv'
      },
      texture: {
        type: '1i'
      },
      time: {
        type: '1f'
      },
      volume: {
        type: '1f'
      },
      isAudio: {
        type: '1f'
      }
    })
  }
  setPostVariables(postNonePrg)
  setPostVariables(postGlitchPrg)
  setPostVariables(postYkobGlitchPrg)
  setPostVariables(postDotPrg)
  setPostVariables(postDotScreenPrg)

  // framebuffer
  let framebufferCount = 1

  videoFramebuffers = [
    createFramebufferFloat(ext, VIDEO_RESOLUTION, VIDEO_RESOLUTION),
    createFramebufferFloat(ext, VIDEO_RESOLUTION, VIDEO_RESOLUTION),
    createFramebufferFloat(ext, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
  ]
  videoBufferIndex = framebufferCount
  framebufferCount += videoFramebuffers.length

  pictureFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ]
  pictureBufferIndex = framebufferCount
  framebufferCount += pictureFramebuffers.length

  velocityFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ]
  velocityBufferIndex = framebufferCount
  framebufferCount += velocityFramebuffers.length

  positionFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ]
  positionBufferIndex = framebufferCount
  framebufferCount += positionFramebuffers.length

  sceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
  sceneBufferIndex = framebufferCount

  initMedia()
}

function initMedia() {
  media = new Media(VIDEO_RESOLUTION, POINT_RESOLUTION)
  media.enumerateDevices().then(initControl)

  detectorMessage = new Vue({
    el: '#detector',
    data: {
      isShow: false,
      isReady: false
    },
    components: {
      [DetectorMessage.name]: DetectorMessage
    }
  })
}

async function initControl() {
  const json = require('./gui/scene.json')
  const preset = location.search.substring(1) || json.preset
  const gui = new dat.GUI({
    load: json,
    preset: preset
  })
  let particleFolder
  let postFolder
  let thumbController
  let videoController
  let changeDetector

  data = json.remembered[preset][0]
  gui.remember(data)

  // scene
  const sceneMap = ['Particle', 'Post Effect']
  const changeScene = () => {
    particleFolder.close()
    postFolder.close()

    switch (data.scene) {
      case 'Post Effect':
        postFolder.open()
        break
      case 'Particle':
      default:
        particleFolder.open()
    }
  }
  gui.add(data, 'scene', sceneMap).onChange(changeScene)

  // Particle folder
  {
    let pointFolder
    let lineFolder

    particleFolder = gui.addFolder('Particle')

    // mode
    const modeMap = {
      'gl.POINTS': gl.POINTS,
      'gl.LINE_STRIP': gl.LINE_STRIP,
      'gl.TRIANGLES': gl.TRIANGLES
    }
    const changeMode = () => {
      pointFolder.close()
      lineFolder.close()

      switch (Number(data.mode)) {
        case gl.LINE_STRIP:
        case gl.TRIANGLES:
          lineFolder.open()
          break
        case gl.POINTS:
        default:
          pointFolder.open()
      }
    }
    particleFolder.add(data, 'mode', modeMap).onChange(changeMode)

    // point folder
    pointFolder = particleFolder.addFolder('gl.POINTS')

    // pointShape
    const pointShapeMap = { square: 0, circle: 1, star: 2, video: 3 }
    pointFolder.add(data, 'pointShape', pointShapeMap)

    // pointSize
    const pointSizeMap = [0.1, 30]
    pointFolder.add(data, 'pointSize', ...pointSizeMap)

    // line folder
    lineFolder = particleFolder.addFolder('gl.LINE_STRIP')

    // lineShape
    const lineShapeMap = ['line', 'mesh']
    const changeLineShape = () => {
      switch (data.lineShape) {
        case 'mesh':
          vbo = meshPointVBO
          arrayLength = (4 * (POINT_RESOLUTION - 1) + 2) * (POINT_RESOLUTION - 1)
          break
        case 'line':
        default:
          vbo = pointVBO
          arrayLength = POINT_RESOLUTION * POINT_RESOLUTION
      }
    }
    lineFolder.add(data, 'lineShape', lineShapeMap).onChange(changeLineShape)

    // deformation
    const tl = new TimelineMax({
      paused: true
    }).fromTo(
      data,
      0.7,
      {
        deformationProgress: 0
      },
      {
        deformationProgress: 1,
        ease: 'Power2.easeOut'
      }
    )
    const changeDeformation = () => {
      data.deformation ? tl.play() : tl.reverse()
    }
    particleFolder.add(data, 'deformation').onChange(changeDeformation)

    // canvas folder
    const canvasFolder = particleFolder.addFolder('canvas')

    // bgColor
    const bgColorMap = { black: 0, white: 1 }
    const changeBgColor = () => {
      let rgbInt = data.bgColor * 255
      canvas.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
    }
    canvasFolder.add(data, 'bgColor', bgColorMap).onChange(changeBgColor)

    // canvasZoom
    const canvasZoomMap = [2, 8]
    const changeZoom = () => {
      updateCamera()
    }
    canvasFolder.add(data, 'canvasZoom', ...canvasZoomMap).onChange(changeZoom)

    // mouse
    const changeMouse = () => {
      if (!data.mouse) {
        mouse = [0.0, 0.0]
      }
    }
    canvasFolder.add(data, 'mouse').onChange(changeMouse)

    // video folder
    const videoFolder = particleFolder.addFolder('video')

    // capture
    const changeCapture = () => {
      isStop = data.capture ? 1 : 0
      isCapture = data.capture
    }
    videoFolder.add(data, 'capture').onChange(changeCapture)

    // stopMotion
    let timer
    const changeStopMotion = () => {
      isStop = data.stopMotion ? 1 : 0
      if (data.stopMotion) {
        timer = setInterval(() => {
          isCapture = true
        }, 1000 / 3)
      } else {
        clearTimeout(timer)
      }
    }
    videoFolder.add(data, 'stopMotion').onChange(changeStopMotion)

    changeMode()
    changeLineShape()
    changeDeformation()
    changeBgColor()
    changeZoom()
    changeMouse()
    changeCapture()
    changeStopMotion()
  }

  // Post Effect folder
  {
    postFolder = gui.addFolder('Post Effect')

    // detector
    changeDetector = () => {
      if (data.detector) {
        thumbController.setValue(true)
        detectorMessage.isShow = true
        runDetector()
      } else {
        if (!detector) return

        thumbController.setValue(false)
        detectorMessage.isShow = false
        resetDetector()
        detector = null
      }
    }
    postFolder.add(data, 'detector').onChange(changeDetector)

    // effect
    const effectMap = ['none', 'glitch', 'ykob glitch', 'dot', 'dot screen']
    const changeEffect = () => {
      switch (data.effect) {
        case 'glitch':
          currentPostPrg = postGlitchPrg
          break
        case 'ykob glitch':
          currentPostPrg = postYkobGlitchPrg
          break
        case 'dot':
          currentPostPrg = postDotPrg
          break
        case 'dot screen':
          currentPostPrg = postDotScreenPrg
          break
        case 'none':
        default:
          currentPostPrg = postNonePrg
      }
    }
    postFolder.add(data, 'effect', effectMap).onChange(changeEffect)

    changeEffect()
  }

  // video folder
  const videoFolder = gui.addFolder('video')
  videoFolder.open()

  // video
  const changeVideo = async () => {
    video = await media.getUserMedia({ video: data.video })
    if (!Object.keys(media.videoDevices).some(key => data.video === media.videoDevices[key])) {
      videoController.setValue(getFirstValue(media.videoDevices))
    }

    webcam = new Webcam(video)
    // await webcam.setup()
    webcam.adjustVideoSize(video.videoWidth || video.naturalWidth, video.videoHeight || video.naturalHeight)

    if (detector) {
      resetDetector()
      runDetector()
    }
  }
  videoController = videoFolder.add(data, 'video', media.videoDevices).onChange(changeVideo)

  // videoZoom
  const videoZoomMap = [1, 3]
  videoFolder.add(data, 'videoZoom', ...videoZoomMap)

  // thumb
  const changeThumb = () => {
    media.toggleThumb(data.thumb)
  }
  thumbController = videoFolder.add(data, 'thumb').onChange(changeThumb)

  // audio folder
  const audioFolder = gui.addFolder('audio')
  audioFolder.open()

  // inputAudio
  const changeInputAudio = () => {
    isAudio = data.inputAudio ? 1 : 0
  }
  audioFolder.add(data, 'inputAudio').onChange(changeInputAudio)

  // audio
  const changeAudio = async () => {
    await media.getUserMedia({ audio: data.audio })
    if (!Object.keys(media.audioDevices).some(key => data.audio === media.audioDevices[key])) {
      audioController.setValue(getFirstValue(media.audioDevices))
    }
  }
  const audioController = audioFolder.add(data, 'audio', media.audioDevices).onChange(changeAudio)

  changeScene()
  changeThumb()
  changeInputAudio()
  changeAudio()
  await changeVideo()
  changeDetector()

  init()
}

async function runDetector() {
  detector = new Detector(webcam, media.wrapper)
  await detector.promise
  detector.detect()
  detectorMessage.isReady = true
}

function resetDetector() {
  detector.reset()
  detectorMessage.isReady = false
}

function updateCamera() {
  mat.lookAt([0.0, 0.0, data.canvasZoom / (S_WIDTH / POINT_RESOLUTION)], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix)
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix)
  mat.multiply(pMatrix, vMatrix, vpMatrix)
}

function init() {
  updateCamera()

  // textures
  createTexture(video)

  bindTexture(videoFramebuffers[0].texture, videoBufferIndex)
  bindTexture(videoFramebuffers[1].texture, videoBufferIndex + 1)
  bindTexture(videoFramebuffers[2].texture, videoBufferIndex + 2)

  bindTexture(pictureFramebuffers[0].texture, pictureBufferIndex)
  bindTexture(pictureFramebuffers[1].texture, pictureBufferIndex + 1)

  bindTexture(velocityFramebuffers[0].texture, velocityBufferIndex)
  bindTexture(velocityFramebuffers[1].texture, velocityBufferIndex + 1)

  bindTexture(positionFramebuffers[0].texture, positionBufferIndex)
  bindTexture(positionFramebuffers[1].texture, positionBufferIndex + 1)
  bindTexture(positionFramebuffers[2].texture, positionBufferIndex + 2)

  bindTexture(sceneFramebuffer.texture, sceneBufferIndex)

  // reset video
  useProgram(videoPrg)
  videoPrg.setAttribute('position')
  videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
  videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
  videoPrg.setUniform('videoTexture', 0)
  videoPrg.setUniform('zoom', data.videoZoom)
  gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < videoFramebuffers.length; ++targetBufferIndex) {
    // video buffer
    bindFramebuffer(videoFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset picture
  useProgram(picturePrg)
  picturePrg.setAttribute('position')
  picturePrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  picturePrg.setUniform('videoTexture', 0)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < pictureFramebuffers.length; ++targetBufferIndex) {
    // picture buffer
    bindFramebuffer(pictureFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset particle position
  useProgram(resetPrg)
  resetPrg.setAttribute('position')
  resetPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  resetPrg.setUniform('videoTexture', 0)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < velocityFramebuffers.length; ++targetBufferIndex) {
    // velocity buffer
    bindFramebuffer(velocityFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetBufferIndex = 0; targetBufferIndex < positionFramebuffers.length; ++targetBufferIndex) {
    // position buffer
    bindFramebuffer(positionFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // flags
  gl.disable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE)

  // setting
  let loopCount = 0
  isRun = true

  render = () => {
    let targetBufferIndex = loopCount % 2
    let prevBufferIndex = 1 - targetBufferIndex

    let posList = (detector && detector.posList) || []
    let focusCount = Math.min(posList.length || 1, 4)

    const volume = media.getVolume()

    // video texture
    createTexture(video)

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND)

    // video update
    gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
    useProgram(videoPrg)
    bindFramebuffer(videoFramebuffers[targetBufferIndex].framebuffer)
    videoPrg.setAttribute('position')
    videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
    videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
    videoPrg.setUniform('videoTexture', 0)
    videoPrg.setUniform('zoom', data.videoZoom)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

    // picture update
    useProgram(picturePrg)
    bindFramebuffer(pictureFramebuffers[targetBufferIndex].framebuffer)
    picturePrg.setAttribute('position')
    picturePrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
    picturePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
    picturePrg.setUniform('prevVideoTexture', videoBufferIndex + prevBufferIndex)
    picturePrg.setUniform('prevPictureTexture', pictureBufferIndex + prevBufferIndex)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // velocity update
    useProgram(velocityPrg)
    bindFramebuffer(velocityFramebuffers[targetBufferIndex].framebuffer)
    velocityPrg.setAttribute('position')
    velocityPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
    velocityPrg.setUniform('prevVelocityTexture', velocityBufferIndex + prevBufferIndex)
    velocityPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
    velocityPrg.setUniform('mouse', mouse)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // position update
    useProgram(positionPrg)
    bindFramebuffer(positionFramebuffers[targetBufferIndex].framebuffer)
    positionPrg.setAttribute('position')
    positionPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
    positionPrg.setUniform('prevPositionTexture', positionBufferIndex + prevBufferIndex)
    positionPrg.setUniform('velocityTexture', velocityBufferIndex + targetBufferIndex)
    positionPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (isCapture) {
      gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
      useProgram(videoPrg)
      bindFramebuffer(videoFramebuffers[2].framebuffer)
      videoPrg.setAttribute('position')
      videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
      videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
      videoPrg.setUniform('videoTexture', 0)
      videoPrg.setUniform('zoom', data.videoZoom)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

      useProgram(positionPrg)
      bindFramebuffer(positionFramebuffers[2].framebuffer)
      positionPrg.setAttribute('position')
      positionPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
      positionPrg.setUniform('prevPositionTexture', positionBufferIndex + prevBufferIndex)
      positionPrg.setUniform('velocityTexture', velocityBufferIndex + targetBufferIndex)
      positionPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      isCapture = false
    }

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)

    if (data.scene === 'Particle') {
      // Particle
      useProgram(scenePrg)
      bindFramebuffer(null)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      rotation[0] += (mouse[0] - rotation[0]) * 0.05
      rotation[1] += (mouse[1] - rotation[1]) * 0.05
      mat.identity(mMatrix)
      mat.rotate(mMatrix, rotation[0], [0.0, 1.0, 0.0], mMatrix)
      mat.rotate(mMatrix, rotation[1], [-1.0, 0.0, 0.0], mMatrix)
      mat.multiply(vpMatrix, mMatrix, mvpMatrix)

      scenePrg.setAttribute('data', vbo)
      scenePrg.setUniform('mvpMatrix', mvpMatrix)
      scenePrg.setUniform('pointSize', data.pointSize * canvasHeight / 930)
      scenePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
      scenePrg.setUniform('positionTexture', positionBufferIndex + targetBufferIndex)
      scenePrg.setUniform('bgColor', data.bgColor)
      scenePrg.setUniform('volume', volume)
      scenePrg.setUniform('capturedVideoTexture', videoBufferIndex + 2)
      scenePrg.setUniform('capturedPositionTexture', positionBufferIndex + 2)
      scenePrg.setUniform('isStop', isStop)
      scenePrg.setUniform('isAudio', isAudio)
      scenePrg.setUniform('mode', data.mode)
      scenePrg.setUniform('pointShape', data.pointShape)
      scenePrg.setUniform('deformationProgress', data.deformationProgress)
      scenePrg.setUniform('loopCount', loopCount)
      gl.drawArrays(data.mode, 0, arrayLength)
    } else if (data.scene === 'Post Effect') {
      // Post Effect

      // render to framebuffer
      useProgram(videoScenePrg)
      bindFramebuffer(sceneFramebuffer.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      videoScenePrg.setAttribute('position')
      videoScenePrg.setUniform('resolution', [canvasWidth, canvasHeight])
      videoScenePrg.setUniform('videoResolution', [media.currentVideo.width, media.currentVideo.height])
      videoScenePrg.setUniform('videoTexture', 0)
      videoScenePrg.setUniform('zoom', data.videoZoom)
      videoScenePrg.setUniform('focusCount', focusCount)
      videoScenePrg.setUniform('focusPos1', posList[0] || defaultFocus)
      videoScenePrg.setUniform('focusPos2', posList[1] || defaultFocus)
      videoScenePrg.setUniform('focusPos3', posList[2] || defaultFocus)
      videoScenePrg.setUniform('focusPos4', posList[3] || defaultFocus)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      // post process
      useProgram(currentPostPrg)
      bindFramebuffer(null)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      currentPostPrg.setAttribute('position')
      currentPostPrg.setUniform('resolution', [canvasWidth, canvasHeight])
      currentPostPrg.setUniform('texture', sceneBufferIndex)
      currentPostPrg.setUniform('time', loopCount / 60)
      currentPostPrg.setUniform('volume', volume)
      currentPostPrg.setUniform('isAudio', isAudio)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
    }

    gl.flush()

    ++loopCount

    // animation loop
    isRun && requestAnimationFrame(render)
  }

  render()
}
