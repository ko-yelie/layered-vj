import {
  POINT_RESOLUTION,
  POP_RESOLUTION,
  BASE_RESOLUTION,
  MIN_ZOOM,
  MAX_ZOOM,
  GPGPU_FRAMEBUFFERS_COUNT,
  CAPTURE_FRAMEBUFFERS_COUNT,
  POST_LIST,
  DEFORMATION_LIST
} from './modules/constant.js'
import MatIV from './modules/minMatrix.js'
import {
  initWebGL,
  initSize,
  createShader,
  Program,
  createVbo,
  createIbo,
  createTexture,
  createFramebuffer,
  createFramebufferFloat,
  getWebGLExtensions,
  updateTexture,
  useProgram,
  bindFramebuffer,
  clearColor,
  getPointVbo
} from './modules/gl-utils.js'
import { clamp } from './modules/utils.js'
import Tween from './modules/tween.js'

const POINT_RESOLUTION_RATE = POINT_RESOLUTION / BASE_RESOLUTION

let canvas
let canvasWidth
let canvasHeight
let gl
let ext
let mat

let planeIndex
let pointVBO
let meshPointVBO
let popPointVBO
let mMatrix
let vMatrix
let pMatrix
let vpMatrix
let mvpMatrix

let textures = {}
let prgs = {}
let postPrgs = {}

let render
let media
let settings = {}
let video
let animation
let focusPosList = []
// let detectorMessage
let vbo
let arrayLength
let popArrayLength
let isRun
let videoZoom = 1
let zoomPos = [0, 0]
let pointer = {
  x: 0,
  y: 0
}
let rotation = {
  x: 0,
  y: 0
}
let cameraPosition = {
  x: 0,
  y: 0,
  z: 5
}
let customSwitch = 0
let isStop = 0
let isCapture = false
let isAudio = 0
let volume = 1
let defaultFocus = [0, 0, 1, 1]
let pointSize = 7
let prevDeformation = 0
let nextDeformation = 0
let deformationProgressTl
let stopMotionTimer

export async function run (options) {
  settings = options.settings
  media = options.media

  // canvas element を取得しサイズをウィンドウサイズに設定
  const obj = initWebGL(options.canvas)
  canvas = obj.canvas
  gl = obj.gl

  initSize({
    onResize () {
      canvasWidth = canvas.width
      canvasHeight = canvas.height
    }
  })

  canvasWidth = canvas.width
  canvasHeight = canvas.height

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
      isRun ? stop() : start()
    }
  })

  let timer
  canvas.addEventListener('pointermove', e => {
    if (!settings.pointer) return

    let x = e.clientX / canvasWidth * 2.0 - 1.0
    let y = e.clientY / canvasHeight * 2.0 - 1.0
    pointer = {
      x,
      y: -y
    }

    clearTimeout(timer)
    canvas.classList.add('s-move')
    timer = setTimeout(() => {
      canvas.classList.remove('s-move')
    }, 500)
  })

  canvas.addEventListener('pointerdown', e => {
    settings.rotation = 1
  })

  canvas.addEventListener('pointerup', e => {
    settings.rotation = 0
  })

  canvas.addEventListener('wheel', e => {
    settings.zPosition += e.deltaY * 0.05
    settings.zPosition = clamp(settings.zPosition, MIN_ZOOM, MAX_ZOOM)
  })

  canvas.addEventListener('click', e => {
    if (settings.capture) {
      isCapture = true
    }
  })

  deformationProgressTl = new Tween(settings, {
    property: 'deformationProgress',
    duration: 700,
    easing: 'easeOutExpo'
  })

  // import shader source code
  const noneVs = createShader(require('../shader/nothing.vert'), 'vertex')

  // video
  {
    const fs = createShader(require('../shader/video.frag'), 'fragment')
    prgs.video = new Program(noneVs, fs)
    if (!prgs.video) return
  }

  // Post Effect
  const postVs = createShader(require('../shader/post/post.vert'), 'vertex')
  for (const name of POST_LIST) {
    const fs = createShader(require(`../shader/post/${name}.frag`), 'fragment')
    postPrgs[name] = new Program(postVs, fs)
    if (!postPrgs[name]) return
  }

  // picture
  {
    const fs = createShader(require('../shader/picture.frag'), 'fragment')
    prgs.picture = new Program(noneVs, fs)
    if (!prgs.picture) return
  }

  // Particle
  {
    const fs = createShader(require('../shader/particle/reset.frag'), 'fragment')
    prgs.reset = new Program(noneVs, fs)
    if (!prgs.reset) return
  }
  {
    const fs = createShader(require('../shader/particle/position.frag'), 'fragment')
    prgs.position = new Program(noneVs, fs)
    if (!prgs.position) return
  }
  {
    const fs = createShader(require('../shader/particle/velocity.frag'), 'fragment')
    prgs.velocity = new Program(noneVs, fs)
    if (!prgs.velocity) return
  }
  {
    const vs = createShader(require('../shader/particle/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/particle/scene.frag'), 'fragment')
    prgs.particleScene = new Program(vs, fs)
    if (!prgs.particleScene) return
  }

  // Pop
  {
    const fs = createShader(require('../shader/particle/pop_velocity.frag'), 'fragment')
    prgs.popVelocity = new Program(noneVs, fs)
    if (!prgs.popVelocity) return
  }
  {
    const fs = createShader(require('../shader/particle/pop_position.frag'), 'fragment')
    prgs.popPosition = new Program(noneVs, fs)
    if (!prgs.popPosition) return
  }
  {
    const vs = createShader(require('../shader/particle/pop_scene.vert'), 'vertex')
    const fs = createShader(require('../shader/particle/pop_scene.frag'), 'fragment')
    prgs.popScene = new Program(vs, fs)
    if (!prgs.popScene) return
  }

  // render
  {
    const vs = createShader(require('../shader/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/scene.frag'), 'fragment')
    prgs.scene = new Program(vs, fs)
    if (!prgs.scene) return
  }

  await initMedia()
  await initGlsl()
  init()
}

async function initMedia () {
  // init media value
  video = media.currentVideo
  videoZoom = settings.videoZoom
  settings.zoomPos = zoomPos

  // textures
  textures.video = createTexture(video)

  DEFORMATION_LIST.forEach(async ({ key, src }) => {
    if (!src) return
    textures[key] = await createTexture(src)
  })
}

function initGlsl () {
  // vertices
  // plane
  let planeCoord = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]
  planeIndex = [0, 1, 2, 2, 1, 3]

  const planeAttribute = {
    position: {
      stride: 3,
      vbo: createVbo(planeCoord),
      ibo: createIbo(planeIndex)
    }
  }

  // point
  const interval = 1 / POINT_RESOLUTION

  pointVBO = getPointVbo(interval)

  const meshTexCoord = []
  for (let t = 0; t < 1 - interval; t += interval) {
    for (let s = 0; s < 1; s += interval) {
      if (s === 1 - interval) {
        meshTexCoord.push(s, t, Math.random(), Math.random())
        meshTexCoord.push(s, t + interval, Math.random(), Math.random())
      } else {
        meshTexCoord.push(s, t, Math.random(), Math.random())
        meshTexCoord.push(s, t + interval, Math.random(), Math.random())
        meshTexCoord.push(s + interval, t + interval, Math.random(), Math.random())
        meshTexCoord.push(s, t, Math.random(), Math.random())
      }
    }
  }
  meshPointVBO = createVbo(meshTexCoord)

  popPointVBO = getPointVbo(1 / POP_RESOLUTION)
  popArrayLength = POP_RESOLUTION * POP_RESOLUTION

  // video
  prgs.video.createAttribute(planeAttribute)
  prgs.video.createUniform({
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
    zoomPos: {
      type: '2fv'
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

  // Post Effect
  function setPostVariables (prg) {
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
      },
      custom: {
        type: '1f'
      },
      customSwitch: {
        type: '1f'
      }
    })
  }
  for (const name of POST_LIST) {
    setPostVariables(postPrgs[name])
  }

  // picture
  prgs.picture.createAttribute(planeAttribute)
  prgs.picture.createUniform({
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

  // Particle
  prgs.reset.createAttribute(planeAttribute)
  prgs.reset.createUniform({
    resolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    }
  })

  prgs.velocity.createAttribute(planeAttribute)
  prgs.velocity.createUniform({
    resolution: {
      type: '2fv'
    },
    prevVelocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    },
    animation: {
      type: '1f'
    },
    isAccel: {
      type: '1f'
    },
    isRotation: {
      type: '1f'
    }
  })

  prgs.position.createAttribute(planeAttribute)
  prgs.position.createUniform({
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
    },
    animation: {
      type: '1f'
    }
  })

  prgs.particleScene.createAttribute({
    data: {
      stride: 4,
      vbo: pointVBO
    }
  })
  prgs.particleScene.createUniform({
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
    logoTexture: {
      type: '1i'
    },
    logo2Texture: {
      type: '1i'
    },
    faceTexture: {
      type: '1i'
    },
    bgColor: {
      type: '1f'
    },
    volume: {
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
    prevDeformation: {
      type: '1f'
    },
    nextDeformation: {
      type: '1f'
    },
    deformationProgress: {
      type: '1f'
    },
    loopCount: {
      type: '1f'
    },
    animation: {
      type: '1f'
    }
  })

  // Pop
  prgs.popVelocity.createAttribute(planeAttribute)
  prgs.popVelocity.createUniform({
    resolution: {
      type: '2fv'
    },
    prevVelocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    }
  })

  prgs.popPosition.createAttribute(planeAttribute)
  prgs.popPosition.createUniform({
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

  prgs.popScene.createAttribute({
    data: {
      stride: 4,
      vbo: popPointVBO
    }
  })
  prgs.popScene.createUniform({
    mvpMatrix: {
      type: 'Matrix4fv'
    },
    resolution: {
      type: '2fv'
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
    velocityTexture: {
      type: '1i'
    },
    bgColor: {
      type: '1f'
    },
    volume: {
      type: '1f'
    },
    isAudio: {
      type: '1f'
    },
    time: {
      type: '1f'
    }
  })

  // render
  prgs.scene.createAttribute(planeAttribute)
  prgs.scene.createUniform({
    particleTexture: {
      type: '1i'
    },
    postTexture: {
      type: '1i'
    },
    resolution: {
      type: '2fv'
    },
    pointResolution: {
      type: '2fv'
    },
    videoAlpha: {
      type: '1f'
    },
    particleAlpha: {
      type: '1f'
    },
    animation: {
      type: '1f'
    }
  })

  // framebuffer

  // video
  textures.videoBuffer = []
  for (var i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; i++) {
    textures.videoBuffer.push(createFramebuffer(canvasWidth, canvasHeight))
  }

  // Post Effect
  textures.postScene = createFramebuffer(canvasWidth, canvasHeight)

  // effect 2
  textures.postSceneLast = createFramebuffer(canvasWidth, canvasHeight)

  // picture
  textures.picture = []
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    textures.picture.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }

  // Particle
  textures.velocity = []
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    textures.velocity.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }

  textures.position = []
  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; i++) {
    textures.position.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }

  textures.particleScene = createFramebuffer(canvasWidth, canvasHeight)

  // Pop
  textures.popVelocity = []
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    textures.popVelocity.push(createFramebufferFloat(ext, POP_RESOLUTION, POP_RESOLUTION))
  }

  textures.popPosition = []
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    textures.popPosition.push(createFramebufferFloat(ext, POP_RESOLUTION, POP_RESOLUTION))
  }

  // last effect
  textures.lastPost = createFramebuffer(canvasWidth, canvasHeight)
}

function init () {
  // init settings
  Object.keys(settings).forEach(key => {
    update(key, settings[key])
  })

  let focusCount = Math.min(focusPosList.length, 4)

  // reset video
  gl.viewport(0, 0, canvasWidth, canvasWidth)
  useProgram(prgs.video)
  prgs.video.setAttribute('position')
  prgs.video.setUniform('resolution', [canvasWidth, canvasHeight])
  prgs.video.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
  prgs.video.setUniform('videoTexture', textures.video.index)
  prgs.video.setUniform('zoom', videoZoom)
  prgs.video.setUniform('zoomPos', zoomPos)
  prgs.video.setUniform('focusCount', focusCount)
  prgs.video.setUniform('focusPos1', focusPosList[0] || defaultFocus)
  prgs.video.setUniform('focusPos2', focusPosList[1] || defaultFocus)
  prgs.video.setUniform('focusPos3', focusPosList[2] || defaultFocus)
  prgs.video.setUniform('focusPos4', focusPosList[3] || defaultFocus)
  for (let targetbufferIndex = 0; targetbufferIndex < CAPTURE_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // video buffer
    bindFramebuffer(textures.videoBuffer[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset picture
  useProgram(prgs.picture)
  prgs.picture.setAttribute('position')
  prgs.picture.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  prgs.picture.setUniform('videoTexture', textures.video.index)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetbufferIndex = 0; targetbufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // picture buffer
    bindFramebuffer(textures.picture[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset particle position
  useProgram(prgs.reset)
  prgs.reset.setAttribute('position')
  prgs.reset.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  prgs.reset.setUniform('videoTexture', textures.video.index)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetbufferIndex = 0; targetbufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // velocity buffer
    bindFramebuffer(textures.velocity[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetbufferIndex = 0; targetbufferIndex < CAPTURE_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // position buffer
    bindFramebuffer(textures.position[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset pop position
  useProgram(prgs.reset)
  prgs.reset.setAttribute('position')
  prgs.reset.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
  prgs.reset.setUniform('videoTexture', textures.video.index)
  gl.viewport(0, 0, POP_RESOLUTION, POP_RESOLUTION)
  for (let targetbufferIndex = 0; targetbufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // pop velocity buffer
    bindFramebuffer(textures.popVelocity[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetbufferIndex = 0; targetbufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // pop position buffer
    bindFramebuffer(textures.popPosition[targetbufferIndex].framebuffer)
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
  let targetbufferIndex
  let prevbufferIndex
  let capturedbufferIndex
  let time
  isRun = true

  vbo = pointVBO
  arrayLength = POINT_RESOLUTION * POINT_RESOLUTION

  render = () => {
    targetbufferIndex = loopCount % 2
    prevbufferIndex = 1 - targetbufferIndex
    capturedbufferIndex = isStop ? 2 : targetbufferIndex
    time = loopCount / 60
    focusCount = Math.min(focusPosList.length, 4)

    // update media value
    videoZoom += (settings.videoZoom - videoZoom) * 0.04

    zoomPos.forEach((pos, i) => {
      zoomPos[i] += (settings.zoomPos[i] - zoomPos[i]) * 0.04
    })

    volume += (media.getVolume() - volume) * 0.1

    // video texture
    updateTexture(textures.video.index, video)

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND)

    // video update
    gl.viewport(0, 0, canvasWidth, canvasWidth)
    useProgram(prgs.video)
    bindFramebuffer(textures.videoBuffer[targetbufferIndex].framebuffer)
    prgs.video.setAttribute('position')
    prgs.video.setUniform('resolution', [canvasWidth, canvasHeight])
    prgs.video.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
    prgs.video.setUniform('videoTexture', textures.video.index)
    prgs.video.setUniform('zoom', videoZoom)
    prgs.video.setUniform('zoomPos', zoomPos)
    prgs.video.setUniform('focusCount', focusCount)
    prgs.video.setUniform('focusPos1', focusPosList[0] || defaultFocus)
    prgs.video.setUniform('focusPos2', focusPosList[1] || defaultFocus)
    prgs.video.setUniform('focusPos3', focusPosList[2] || defaultFocus)
    prgs.video.setUniform('focusPos4', focusPosList[3] || defaultFocus)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (isCapture) {
      bindFramebuffer(textures.videoBuffer[capturedbufferIndex].framebuffer)
      prgs.video.setAttribute('position')
      prgs.video.setUniform('resolution', [canvasWidth, canvasHeight])
      prgs.video.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
      prgs.video.setUniform('videoTexture', textures.video.index)
      prgs.video.setUniform('zoom', videoZoom)
      prgs.video.setUniform('zoomPos', zoomPos)
      prgs.video.setUniform('focusCount', focusCount)
      prgs.video.setUniform('focusPos1', focusPosList[0] || defaultFocus)
      prgs.video.setUniform('focusPos2', focusPosList[1] || defaultFocus)
      prgs.video.setUniform('focusPos3', focusPosList[2] || defaultFocus)
      prgs.video.setUniform('focusPos4', focusPosList[3] || defaultFocus)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
    }

    // Post Effect
    useProgram(prgs.currentPost)
    bindFramebuffer(textures.postScene.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    prgs.currentPost.setAttribute('position')
    prgs.currentPost.setUniform('resolution', [canvasWidth, canvasHeight])
    prgs.currentPost.setUniform('texture', textures.videoBuffer[capturedbufferIndex].index)
    prgs.currentPost.setUniform('time', time)
    prgs.currentPost.setUniform('volume', volume)
    prgs.currentPost.setUniform('isAudio', isAudio)
    prgs.currentPost.setUniform('custom', settings.custom)
    prgs.currentPost.setUniform('customSwitch', customSwitch)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // effect 2
    useProgram(prgs.currentPost2)
    bindFramebuffer(textures.postSceneLast.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    prgs.currentPost2.setAttribute('position')
    prgs.currentPost2.setUniform('resolution', [canvasWidth, canvasHeight])
    prgs.currentPost2.setUniform('texture', textures.postScene.index)
    prgs.currentPost2.setUniform('time', time)
    prgs.currentPost2.setUniform('volume', volume)
    prgs.currentPost2.setUniform('isAudio', isAudio)
    prgs.currentPost2.setUniform('custom', settings.custom)
    prgs.currentPost2.setUniform('customSwitch', customSwitch)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (settings.animation === 'normal' || settings.animation === 'warp' || settings.animation === 'pop') {
      gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

      // picture update
      useProgram(prgs.picture)
      bindFramebuffer(textures.picture[targetbufferIndex].framebuffer)
      prgs.picture.setAttribute('position')
      prgs.picture.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
      prgs.picture.setUniform('videoTexture', textures.videoBuffer[targetbufferIndex].index)
      prgs.picture.setUniform('prevVideoTexture', textures.videoBuffer[prevbufferIndex].index)
      prgs.picture.setUniform('prevPictureTexture', textures.picture[prevbufferIndex].index)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      if (settings.animation === 'normal' || settings.animation === 'warp') {
        // Particle

        // velocity update
        useProgram(prgs.velocity)
        bindFramebuffer(textures.velocity[targetbufferIndex].framebuffer)
        prgs.velocity.setAttribute('position')
        prgs.velocity.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
        prgs.velocity.setUniform('prevVelocityTexture', textures.velocity[prevbufferIndex].index)
        prgs.velocity.setUniform('pictureTexture', textures.picture[targetbufferIndex].index)
        prgs.velocity.setUniform('animation', animation)
        prgs.velocity.setUniform('isAccel', settings.accel)
        prgs.velocity.setUniform('isRotation', settings.rotation)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        // position update
        useProgram(prgs.position)
        bindFramebuffer(textures.position[targetbufferIndex].framebuffer)
        prgs.position.setAttribute('position')
        prgs.position.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
        prgs.position.setUniform('prevPositionTexture', textures.position[prevbufferIndex].index)
        prgs.position.setUniform('velocityTexture', textures.velocity[targetbufferIndex].index)
        prgs.position.setUniform('pictureTexture', textures.picture[targetbufferIndex].index)
        prgs.position.setUniform('animation', animation)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        if (isCapture) {
          useProgram(prgs.position)
          bindFramebuffer(textures.position[capturedbufferIndex].framebuffer)
          prgs.position.setAttribute('position')
          prgs.position.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
          prgs.position.setUniform('prevPositionTexture', textures.position[prevbufferIndex].index)
          prgs.position.setUniform('velocityTexture', textures.velocity[targetbufferIndex].index)
          prgs.position.setUniform('pictureTexture', textures.picture[targetbufferIndex].index)
          prgs.position.setUniform('animation', animation)
          gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
        }

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        useProgram(prgs.particleScene)
        bindFramebuffer(textures.particleScene.framebuffer)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.viewport(0, 0, canvasWidth, canvasHeight)

        rotation.x += (pointer.x - rotation.x) * 0.01
        rotation.y += (pointer.y - rotation.y) * 0.01
        updateCamera()

        prgs.particleScene.setAttribute('data', vbo)
        prgs.particleScene.setUniform('mvpMatrix', mvpMatrix)
        prgs.particleScene.setUniform('pointSize', pointSize)
        prgs.particleScene.setUniform('videoTexture', textures.videoBuffer[capturedbufferIndex].index)
        prgs.particleScene.setUniform('positionTexture', textures.position[capturedbufferIndex].index)
        DEFORMATION_LIST.forEach(({ key, src }) => {
          if (!src) return
          prgs.particleScene.setUniform(`${key}Texture`, textures[key].index)
        })
        prgs.particleScene.setUniform('bgColor', settings.bgColor)
        prgs.particleScene.setUniform('volume', volume)
        prgs.particleScene.setUniform('isAudio', isAudio)
        prgs.particleScene.setUniform('mode', settings.mode)
        prgs.particleScene.setUniform('pointShape', settings.pointShape)
        prgs.particleScene.setUniform('prevDeformation', prevDeformation)
        prgs.particleScene.setUniform('nextDeformation', nextDeformation)
        prgs.particleScene.setUniform('deformationProgress', settings.deformationProgress)
        prgs.particleScene.setUniform('loopCount', loopCount)
        prgs.particleScene.setUniform('animation', animation)
        gl.drawArrays(settings.mode, 0, arrayLength)
      } else if (settings.animation === 'pop') {
        // Pop

        gl.viewport(0, 0, POP_RESOLUTION, POP_RESOLUTION)

        // velocity update
        useProgram(prgs.popVelocity)
        bindFramebuffer(textures.popVelocity[targetbufferIndex].framebuffer)
        prgs.popVelocity.setAttribute('position')
        prgs.popVelocity.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
        prgs.popVelocity.setUniform('prevVelocityTexture', textures.popVelocity[prevbufferIndex].index)
        prgs.popVelocity.setUniform('pictureTexture', textures.picture[targetbufferIndex].index)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        // position update
        useProgram(prgs.popPosition)
        bindFramebuffer(textures.popPosition[targetbufferIndex].framebuffer)
        prgs.popPosition.setAttribute('position')
        prgs.popPosition.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
        prgs.popPosition.setUniform('prevPositionTexture', textures.popPosition[prevbufferIndex].index)
        prgs.popPosition.setUniform('velocityTexture', textures.popVelocity[targetbufferIndex].index)
        prgs.popPosition.setUniform('pictureTexture', textures.picture[targetbufferIndex].index)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        gl.enable(gl.BLEND)

        useProgram(prgs.popScene)
        bindFramebuffer(textures.particleScene.framebuffer)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.viewport(0, 0, canvasWidth, canvasHeight)

        rotation.x += (pointer.x - rotation.x) * 0.01
        rotation.y += (pointer.y - rotation.y) * 0.01
        updateCamera()

        prgs.popScene.setAttribute('data')
        prgs.popScene.setUniform('mvpMatrix', mvpMatrix)
        prgs.popScene.setUniform('resolution', [canvasWidth, canvasHeight])
        prgs.popScene.setUniform('pointSize', pointSize)
        prgs.popScene.setUniform('videoTexture', textures.videoBuffer[targetbufferIndex].index)
        prgs.popScene.setUniform('positionTexture', textures.popPosition[targetbufferIndex].index)
        prgs.popScene.setUniform('velocityTexture', textures.popVelocity[targetbufferIndex].index)
        prgs.popScene.setUniform('bgColor', settings.bgColor)
        prgs.popScene.setUniform('volume', volume)
        prgs.popScene.setUniform('isAudio', isAudio)
        prgs.popScene.setUniform('time', time)
        gl.drawArrays(gl.POINTS, 0, popArrayLength)
      }
    }

    // mix video and particle
    useProgram(prgs.scene)
    bindFramebuffer(textures.lastPost.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    prgs.scene.setAttribute('position')
    prgs.scene.setUniform('particleTexture', textures.particleScene.index)
    prgs.scene.setUniform('postTexture', textures.postSceneLast.index)
    prgs.scene.setUniform('resolution', [canvasWidth, canvasHeight])
    prgs.scene.setUniform('pointResolution', [POINT_RESOLUTION, POINT_RESOLUTION])
    prgs.scene.setUniform('videoAlpha', settings.videoAlpha)
    prgs.scene.setUniform('particleAlpha', settings.particleAlpha)
    prgs.scene.setUniform('animation', animation)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)

    // last effect
    useProgram(prgs.lastPost)
    bindFramebuffer(null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    prgs.lastPost.setAttribute('position')
    prgs.lastPost.setUniform('resolution', [canvasWidth, canvasHeight])
    prgs.lastPost.setUniform('texture', textures.lastPost.index)
    prgs.lastPost.setUniform('time', time)
    prgs.lastPost.setUniform('volume', volume)
    prgs.lastPost.setUniform('isAudio', isAudio)
    prgs.lastPost.setUniform('custom', settings.custom)
    prgs.lastPost.setUniform('customSwitch', customSwitch)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    isCapture = false

    // animation loop
    if (isRun) {
      ++loopCount
      requestAnimationFrame(render)
    }
  }

  render()
}

function updateCamera () {
  const cameraPositionRate = settings.animation === 'warp' ? 1.5 : 0.3
  cameraPosition.x += (pointer.x * cameraPositionRate - cameraPosition.x) * 0.1
  cameraPosition.y += (pointer.y * cameraPositionRate - cameraPosition.y) * 0.1
  cameraPosition.z += (settings.zPosition - cameraPosition.z) * 0.1

  mat.identity(mMatrix)
  mat.lookAt(
    [cameraPosition.x, cameraPosition.y, cameraPosition.z],
    [cameraPosition.x, cameraPosition.y, 0.0],
    [0.0, 1.0, 0.0],
    vMatrix
  )
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix)
  mat.multiply(pMatrix, vMatrix, vpMatrix)

  mat.rotate(mMatrix, rotation.x, [0.0, 1.0, 0.0], mMatrix)
  mat.rotate(mMatrix, rotation.y, [-1.0, 0.0, 0.0], mMatrix)
  mat.multiply(vpMatrix, mMatrix, mvpMatrix)
}

export function update (property, value) {
  settings[property] = value

  switch (property) {
    case 'customSwitch':
      customSwitch = settings.customSwitch ? 1 : 0
      break
    case 'animation':
      switch (settings.animation) {
        case 'normal':
          animation = 0
          break
        case 'warp':
          animation = 1
          break
        case 'pop':
          animation = 2
          break
        case 'none':
        default:
          animation = -1
      }
      break
    case 'pointSize':
      pointSize = settings.pointSize * canvasHeight / 930 / Math.pow(POINT_RESOLUTION_RATE, 0.4)
      break
    case 'lineShape':
      switch (settings.lineShape) {
        case 'mesh':
          vbo = meshPointVBO
          arrayLength = (4 * (POINT_RESOLUTION - 1) + 2) * (POINT_RESOLUTION - 1)
          break
        case 'line':
        default:
          vbo = pointVBO
          arrayLength = POINT_RESOLUTION * POINT_RESOLUTION
      }
      break
    case 'deformation':
      if (deformationProgressTl.target.deformationProgress === 1) {
        prevDeformation = settings.deformation
        deformationProgressTl.reverse()
      } else {
        nextDeformation = settings.deformation
        deformationProgressTl.play()
      }
      break
    case 'bgColor':
      let rgbInt = settings.bgColor * 255
      document.body.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
      break
    case 'pointer':
      if (!settings.pointer) {
        pointer = {
          x: 0,
          y: 0
        }
      }
      break
    case 'pointerPosition':
      if (settings.pointer) {
        pointer = value
      }
      break
    case 'capture':
      isStop = settings.capture ? 1 : 0
      isCapture = settings.capture
      break
    case 'stopMotion':
      isStop = settings.stopMotion ? 1 : 0
      if (settings.stopMotion) {
        stopMotionTimer = setInterval(() => {
          isCapture = true
        }, 1000 / 3)
      } else {
        clearTimeout(stopMotionTimer)
      }
      break
    case 'effect':
      prgs.currentPost = postPrgs[settings.effect || POST_LIST[0]]
      break
    case 'effect2':
      prgs.currentPost2 = postPrgs[settings.effect2 || POST_LIST[0]]
      break
    case 'lastEffect':
      prgs.lastPost = postPrgs[settings.lastEffect || POST_LIST[0]]
      break

    // media
    case 'video':
      video = media.currentVideo
      break
    case 'detect':
      focusPosList = value
      break
    case 'inputAudio':
      isAudio = settings.inputAudio ? 1 : 0
      break
  }
}

export function stop () {
  isRun = false
}

export function start () {
  isRun = true
  render()
}
