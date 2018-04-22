import MatIV from './minMatrix.js'

import {
  setGl,
  ProgramParameter,
  createShader,
  createProgram,
  createVbo,
  createIbo,
  setAttribute,
  createFramebufferFloat,
  getWebGLExtensions
} from './gl-utils.js'

import { getFirstValue } from './utils.js'

import Media from './media.js'

const POINT_RESOLUTION = 128

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
let videoBufferIndex
let pictureBufferIndex
let velocityBufferIndex
let positionBufferIndex

let scenePrg
let videoPrg
let picturePrg
let resetPrg
let positionPrg
let velocityPrg

let render
let media
let data = {}
let video
let vbo
let arrayLength
let isStop = 0
let isCapture = false

export default function run() {
  // canvas element を取得しサイズをウィンドウサイズに設定
  canvas = document.getElementById('canvas')
  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // webgl コンテキストを初期化
  gl = canvas.getContext('webgl')
  if (gl == null) {
    console.log('webgl unsupported')
    return
  }
  setGl(gl)
  mat = new MatIV()

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
    if (!data.capture) return

    isCapture = true
  })

  // 外部ファイルのシェーダのソースを取得しプログラムオブジェクトを生成
  {
    let vs = createShader(require('../shader/scene.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/scene.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    scenePrg = new ProgramParameter(prg)
  }
  {
    let vs = createShader(require('../shader/video.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/video.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    videoPrg = new ProgramParameter(prg)
  }
  {
    let vs = createShader(require('../shader/picture.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/picture.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    picturePrg = new ProgramParameter(prg)
  }
  {
    let vs = createShader(require('../shader/reset.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/reset.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    resetPrg = new ProgramParameter(prg)
  }
  {
    let vs = createShader(require('../shader/position.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/position.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    positionPrg = new ProgramParameter(prg)
  }
  {
    let vs = createShader(require('../shader/velocity.vert'), gl.VERTEX_SHADER)
    let fs = createShader(require('../shader/velocity.frag'), gl.FRAGMENT_SHADER)
    let prg = createProgram(vs, fs)
    if (prg == null) return
    velocityPrg = new ProgramParameter(prg)
  }

  initGlsl()
}

function initGlsl() {
  videoPrg.attLocation[0] = gl.getAttribLocation(videoPrg.program, 'position')
  videoPrg.attStride[0] = 3
  videoPrg.uniLocation[0] = gl.getUniformLocation(videoPrg.program, 'resolution')
  videoPrg.uniLocation[1] = gl.getUniformLocation(videoPrg.program, 'videoTexture')
  videoPrg.uniLocation[2] = gl.getUniformLocation(videoPrg.program, 'zoom')
  videoPrg.uniType[0] = 'uniform2fv'
  videoPrg.uniType[1] = 'uniform1i'
  videoPrg.uniType[2] = 'uniform1f'

  picturePrg.attLocation[0] = gl.getAttribLocation(picturePrg.program, 'position')
  picturePrg.attStride[0] = 3
  picturePrg.uniLocation[0] = gl.getUniformLocation(picturePrg.program, 'resolution')
  picturePrg.uniLocation[1] = gl.getUniformLocation(picturePrg.program, 'videoTexture')
  picturePrg.uniLocation[2] = gl.getUniformLocation(picturePrg.program, 'prevVideoTexture')
  picturePrg.uniLocation[3] = gl.getUniformLocation(picturePrg.program, 'prevPictureTexture')
  picturePrg.uniType[0] = 'uniform2fv'
  picturePrg.uniType[1] = 'uniform1i'
  picturePrg.uniType[2] = 'uniform1i'
  picturePrg.uniType[3] = 'uniform1i'

  resetPrg.attLocation[0] = gl.getAttribLocation(resetPrg.program, 'position')
  resetPrg.attStride[0] = 3
  resetPrg.uniLocation[0] = gl.getUniformLocation(resetPrg.program, 'resolution')
  resetPrg.uniLocation[1] = gl.getUniformLocation(resetPrg.program, 'videoTexture')
  resetPrg.uniType[0] = 'uniform2fv'
  resetPrg.uniType[1] = 'uniform1i'

  velocityPrg.attLocation[0] = gl.getAttribLocation(velocityPrg.program, 'position')
  velocityPrg.attStride[0] = 3
  velocityPrg.uniLocation[0] = gl.getUniformLocation(velocityPrg.program, 'prevVelocityTexture')
  velocityPrg.uniLocation[1] = gl.getUniformLocation(velocityPrg.program, 'pictureTexture')
  velocityPrg.uniLocation[2] = gl.getUniformLocation(velocityPrg.program, 'resolution')
  velocityPrg.uniLocation[3] = gl.getUniformLocation(velocityPrg.program, 'mouse')
  velocityPrg.uniType[0] = 'uniform1i'
  velocityPrg.uniType[1] = 'uniform1i'
  velocityPrg.uniType[2] = 'uniform2fv'
  velocityPrg.uniType[3] = 'uniform2fv'

  positionPrg.attLocation[0] = gl.getAttribLocation(positionPrg.program, 'position')
  positionPrg.attStride[0] = 3
  positionPrg.uniLocation[0] = gl.getUniformLocation(positionPrg.program, 'prevPositionTexture')
  positionPrg.uniLocation[1] = gl.getUniformLocation(positionPrg.program, 'velocityTexture')
  positionPrg.uniLocation[2] = gl.getUniformLocation(positionPrg.program, 'pictureTexture')
  positionPrg.uniLocation[3] = gl.getUniformLocation(positionPrg.program, 'resolution')
  positionPrg.uniType[0] = 'uniform1i'
  positionPrg.uniType[1] = 'uniform1i'
  positionPrg.uniType[2] = 'uniform1i'
  positionPrg.uniType[3] = 'uniform2fv'

  scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'texCoord')
  scenePrg.attStride[0] = 2
  scenePrg.uniLocation[0] = gl.getUniformLocation(scenePrg.program, 'mvpMatrix')
  scenePrg.uniLocation[1] = gl.getUniformLocation(scenePrg.program, 'size')
  scenePrg.uniLocation[2] = gl.getUniformLocation(scenePrg.program, 'videoTexture')
  scenePrg.uniLocation[3] = gl.getUniformLocation(scenePrg.program, 'positionTexture')
  scenePrg.uniLocation[4] = gl.getUniformLocation(scenePrg.program, 'bgColor')
  scenePrg.uniLocation[5] = gl.getUniformLocation(scenePrg.program, 'volume')
  scenePrg.uniLocation[6] = gl.getUniformLocation(scenePrg.program, 'capturedVideoTexture')
  scenePrg.uniLocation[7] = gl.getUniformLocation(scenePrg.program, 'capturedPositionTexture')
  scenePrg.uniLocation[8] = gl.getUniformLocation(scenePrg.program, 'isStop')
  scenePrg.uniType[0] = 'uniformMatrix4fv'
  scenePrg.uniType[1] = 'uniform1f'
  scenePrg.uniType[2] = 'uniform1i'
  scenePrg.uniType[3] = 'uniform1i'
  scenePrg.uniType[4] = 'uniform1f'
  scenePrg.uniType[5] = 'uniform1f'
  scenePrg.uniType[6] = 'uniform1i'
  scenePrg.uniType[7] = 'uniform1i'
  scenePrg.uniType[8] = 'uniform1f'

  const sWidth = 256
  const tHeight = 256
  const sInterval = sWidth / POINT_RESOLUTION / sWidth
  const tInterval = tHeight / POINT_RESOLUTION / tHeight

  let pointTexCoord = []
  for (let t = 0; t < 1; t += tInterval) {
    const back = t % (tInterval * 2) === tInterval
    for (let s = 0; s < 1; s += sInterval) {
      const cS = (back ? 1 : 0) + s * (back ? -1 : 1)
      pointTexCoord.push(cS, t)
    }
  }
  pointVBO = [createVbo(pointTexCoord)]

  pointTexCoord = []
  for (let t = 0; t < 1 - tInterval; t += tInterval) {
    for (let s = 0; s < 1; s += sInterval) {
      if (s === sWidth - sInterval) {
        pointTexCoord.push(s, t)
        pointTexCoord.push(s, t + tInterval)
      } else {
        pointTexCoord.push(s, t)
        pointTexCoord.push(s, t + tInterval)
        pointTexCoord.push(s + sInterval, t + tInterval)
        pointTexCoord.push(s, t)
      }
    }
  }
  meshPointVBO = [createVbo(pointTexCoord)]

  // vertices
  let planePosition = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]
  planeIndex = [0, 1, 2, 2, 1, 3]
  planeVBO = [createVbo(planePosition)]
  planeIBO = createIbo(planeIndex)

  // matrix
  mMatrix = mat.identity(mat.create())
  vMatrix = mat.identity(mat.create())
  pMatrix = mat.identity(mat.create())
  vpMatrix = mat.identity(mat.create())
  mvpMatrix = mat.identity(mat.create())
  mat.lookAt([0.0, 0.0, 5.0 / (sWidth / POINT_RESOLUTION)], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix)
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix)
  mat.multiply(pMatrix, vMatrix, vpMatrix)

  // framebuffer
  let framebufferCount = 1

  videoFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
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

  initControl()
}

function initControl() {
  const gui = new dat.GUI()

  // mode
  const modeMap = {
    'gl.POINTS': gl.POINTS,
    'gl.LINE_STRIP': gl.LINE_STRIP,
    'gl.TRIANGLES': gl.TRIANGLES
  }
  data.mode = getFirstValue(modeMap)
  gui.add(data, 'mode', modeMap)

  // lineShape
  const lineShapeMap = ['line', 'mesh']
  const changeLineShape = val => {
    switch (val) {
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
  data.lineShape = lineShapeMap[0]
  gui.add(data, 'lineShape', lineShapeMap).onChange(changeLineShape)
  changeLineShape(data.lineShape)

  // bgColor
  const bgColorMap = { black: 0, white: 1 }
  const changeBgColor = val => {
    let rgbInt = val * 255
    canvas.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
  }
  data.bgColor = getFirstValue(bgColorMap)
  gui.add(data, 'bgColor', bgColorMap).onChange(changeBgColor)
  changeBgColor(data.bgColor)

  // zoom
  const zoomMap = [1, 3]
  data.zoom = zoomMap[0]
  gui.add(data, 'zoom', ...zoomMap)

  // mouse
  data.mouse = false
  gui.add(data, 'mouse').onChange(() => {
    if (!data.mouse) {
      mouse = [0.0, 0.0]
    }
  })

  // capture
  data.capture = false
  gui.add(data, 'capture').onChange(() => {
    isStop = data.capture ? 1 : 0
    isCapture = data.capture
  })

  // stopMotion
  data.stopMotion = false
  let timer
  gui.add(data, 'stopMotion').onChange(() => {
    isStop = data.stopMotion ? 1 : 0
    if (data.stopMotion) {
      timer = setInterval(() => {
        isCapture = true
      }, 1000 / 3)
    } else {
      clearTimeout(timer)
    }
  })

  // thumb
  data.thumb = false
  gui.add(data, 'thumb').onChange(() => {
    media.toggleThumb(data.thumb)
  })

  // video
  media = new Media(POINT_RESOLUTION)
  media.enumerateDevices().then(() => {
    const changeVideo = val =>
      media.getUserMedia(val).then(() => {
        video = media.video
      })
    const videoDevicesKeys = Object.keys(media.videoDevices)
    const faceTimeCameraKeys = videoDevicesKeys.filter(key => /FaceTime HD Camera/.test(key))
    const currentVideoKey = (faceTimeCameraKeys.length > 0 ? faceTimeCameraKeys : videoDevicesKeys)[0]
    data.video = media.videoDevices[currentVideoKey]
    gui.add(data, 'video', media.videoDevices).onChange(changeVideo)
    changeVideo(data.video).then(init)
  })
}

function init() {
  // video texture
  var videoTexture = gl.createTexture(gl.TEXTURE_2D)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, videoTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // textures
  gl.activeTexture(gl.TEXTURE0 + videoBufferIndex)
  gl.bindTexture(gl.TEXTURE_2D, videoFramebuffers[0].texture)
  gl.activeTexture(gl.TEXTURE0 + videoBufferIndex + 1)
  gl.bindTexture(gl.TEXTURE_2D, videoFramebuffers[1].texture)
  gl.activeTexture(gl.TEXTURE0 + videoBufferIndex + 2)
  gl.bindTexture(gl.TEXTURE_2D, videoFramebuffers[2].texture)

  gl.activeTexture(gl.TEXTURE0 + pictureBufferIndex)
  gl.bindTexture(gl.TEXTURE_2D, pictureFramebuffers[0].texture)
  gl.activeTexture(gl.TEXTURE0 + pictureBufferIndex + 1)
  gl.bindTexture(gl.TEXTURE_2D, pictureFramebuffers[1].texture)

  gl.activeTexture(gl.TEXTURE0 + velocityBufferIndex)
  gl.bindTexture(gl.TEXTURE_2D, velocityFramebuffers[0].texture)
  gl.activeTexture(gl.TEXTURE0 + velocityBufferIndex + 1)
  gl.bindTexture(gl.TEXTURE_2D, velocityFramebuffers[1].texture)

  gl.activeTexture(gl.TEXTURE0 + positionBufferIndex)
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[0].texture)
  gl.activeTexture(gl.TEXTURE0 + positionBufferIndex + 1)
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[1].texture)
  gl.activeTexture(gl.TEXTURE0 + positionBufferIndex + 2)
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[2].texture)

  // reset video
  gl.useProgram(videoPrg.program)
  gl[videoPrg.uniType[0]](videoPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
  gl[videoPrg.uniType[1]](videoPrg.uniLocation[1], 0)
  setAttribute(planeVBO, videoPrg.attLocation, videoPrg.attStride, planeIBO)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < videoFramebuffers.length; ++targetBufferIndex) {
    // video buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, videoFramebuffers[targetBufferIndex].framebuffer)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset picture
  gl.useProgram(picturePrg.program)
  gl[picturePrg.uniType[0]](picturePrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
  gl[picturePrg.uniType[1]](picturePrg.uniLocation[1], 0)
  setAttribute(planeVBO, picturePrg.attLocation, picturePrg.attStride)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < pictureFramebuffers.length; ++targetBufferIndex) {
    // picture buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, pictureFramebuffers[targetBufferIndex].framebuffer)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset particle position
  gl.useProgram(resetPrg.program)
  gl[resetPrg.uniType[0]](resetPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
  gl[resetPrg.uniType[1]](resetPrg.uniLocation[1], 0)
  setAttribute(planeVBO, resetPrg.attLocation, resetPrg.attStride, planeIBO)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < velocityFramebuffers.length; ++targetBufferIndex) {
    // velocity buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFramebuffers[targetBufferIndex].framebuffer)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetBufferIndex = 0; targetBufferIndex < positionFramebuffers.length; ++targetBufferIndex) {
    // position buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[targetBufferIndex].framebuffer)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
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

    const volume = media.update()

    // video texture
    var videoTexture = gl.createTexture(gl.TEXTURE_2D)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, videoTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND)
    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

    // video update
    gl.useProgram(videoPrg.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, videoFramebuffers[targetBufferIndex].framebuffer)
    setAttribute(planeVBO, videoPrg.attLocation, videoPrg.attStride, planeIBO)
    gl[videoPrg.uniType[0]](videoPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
    gl[videoPrg.uniType[1]](videoPrg.uniLocation[1], 0)
    gl[videoPrg.uniType[2]](videoPrg.uniLocation[2], data.zoom)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // picture update
    gl.useProgram(picturePrg.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, pictureFramebuffers[targetBufferIndex].framebuffer)
    setAttribute(planeVBO, picturePrg.attLocation, picturePrg.attStride)
    gl[picturePrg.uniType[0]](picturePrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
    gl[picturePrg.uniType[1]](picturePrg.uniLocation[1], videoBufferIndex + targetBufferIndex)
    gl[picturePrg.uniType[2]](picturePrg.uniLocation[2], videoBufferIndex + prevBufferIndex)
    gl[picturePrg.uniType[3]](picturePrg.uniLocation[3], pictureBufferIndex + prevBufferIndex)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // velocity update
    gl.useProgram(velocityPrg.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFramebuffers[targetBufferIndex].framebuffer)
    setAttribute(planeVBO, velocityPrg.attLocation, velocityPrg.attStride, planeIBO)
    gl[velocityPrg.uniType[0]](velocityPrg.uniLocation[0], velocityBufferIndex + prevBufferIndex)
    gl[velocityPrg.uniType[1]](velocityPrg.uniLocation[1], pictureBufferIndex + targetBufferIndex)
    gl[velocityPrg.uniType[2]](velocityPrg.uniLocation[2], [POINT_RESOLUTION, POINT_RESOLUTION])
    gl[velocityPrg.uniType[3]](velocityPrg.uniLocation[3], mouse)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // position update
    gl.useProgram(positionPrg.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[targetBufferIndex].framebuffer)
    setAttribute(planeVBO, positionPrg.attLocation, positionPrg.attStride, planeIBO)
    gl[positionPrg.uniType[0]](positionPrg.uniLocation[0], positionBufferIndex + prevBufferIndex)
    gl[positionPrg.uniType[1]](positionPrg.uniLocation[1], velocityBufferIndex + targetBufferIndex)
    gl[positionPrg.uniType[2]](positionPrg.uniLocation[2], pictureBufferIndex + targetBufferIndex)
    gl[positionPrg.uniType[3]](positionPrg.uniLocation[3], [POINT_RESOLUTION, POINT_RESOLUTION])
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (isCapture) {
      gl.useProgram(videoPrg.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, videoFramebuffers[2].framebuffer)
      setAttribute(planeVBO, videoPrg.attLocation, videoPrg.attStride, planeIBO)
      gl[videoPrg.uniType[0]](videoPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION])
      gl[videoPrg.uniType[1]](videoPrg.uniLocation[1], 0)
      gl[videoPrg.uniType[2]](videoPrg.uniLocation[2], data.zoom)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      gl.useProgram(positionPrg.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[2].framebuffer)
      setAttribute(planeVBO, positionPrg.attLocation, positionPrg.attStride, planeIBO)
      gl[positionPrg.uniType[0]](positionPrg.uniLocation[0], positionBufferIndex + prevBufferIndex)
      gl[positionPrg.uniType[1]](positionPrg.uniLocation[1], velocityBufferIndex + targetBufferIndex)
      gl[positionPrg.uniType[2]](positionPrg.uniLocation[2], pictureBufferIndex + targetBufferIndex)
      gl[positionPrg.uniType[3]](positionPrg.uniLocation[3], [POINT_RESOLUTION, POINT_RESOLUTION])
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      isCapture = false
    }

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND)
    gl.useProgram(scenePrg.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    setAttribute(vbo, scenePrg.attLocation, scenePrg.attStride)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    // push and render
    rotation[0] += (mouse[0] - rotation[0]) * 0.05
    rotation[1] += (mouse[1] - rotation[1]) * 0.05
    mat.identity(mMatrix)
    mat.rotate(mMatrix, rotation[0], [0.0, 1.0, 0.0], mMatrix)
    mat.rotate(mMatrix, rotation[1], [-1.0, 0.0, 0.0], mMatrix)
    mat.multiply(vpMatrix, mMatrix, mvpMatrix)
    gl[scenePrg.uniType[0]](scenePrg.uniLocation[0], false, mvpMatrix)
    gl[scenePrg.uniType[1]](scenePrg.uniLocation[1], canvasHeight)
    gl[scenePrg.uniType[2]](scenePrg.uniLocation[2], videoBufferIndex + targetBufferIndex)
    gl[scenePrg.uniType[3]](scenePrg.uniLocation[3], positionBufferIndex + targetBufferIndex)
    gl[scenePrg.uniType[4]](scenePrg.uniLocation[4], data.bgColor)
    gl[scenePrg.uniType[5]](scenePrg.uniLocation[5], volume)
    gl[scenePrg.uniType[6]](scenePrg.uniLocation[6], videoBufferIndex + 2)
    gl[scenePrg.uniType[7]](scenePrg.uniLocation[7], positionBufferIndex + 2)
    gl[scenePrg.uniType[8]](scenePrg.uniLocation[8], isStop)
    gl.drawArrays(data.mode, 0, arrayLength)

    gl.flush()

    ++loopCount

    // animation loop
    if (isRun) {
      requestAnimationFrame(render)
    }
  }

  render()
}
