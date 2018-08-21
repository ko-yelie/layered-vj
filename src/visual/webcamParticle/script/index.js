import {
  POINT_RESOLUTION,
  POP_RESOLUTION,
  BASE_RESOLUTION,
  MIN_ZOOM,
  MAX_ZOOM,
  GPGPU_FRAMEBUFFERS_COUNT,
  CAPTURE_FRAMEBUFFERS_COUNT,
  VIDEO_FRAMEBUFFERS_COUNT,
  POST_LIST,
  DEFORMATION_LIST,
  TORUS_SIZE,
  MALE_SIZE
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
  getPointVbo,
  getPlaneVbo
} from './modules/gl-utils.js'
import { loadJSON, getModelVbo } from './modules/three-utils.js'
import { clamp } from './modules/utils.js'
import Tween from './modules/tween.js'
import * as THREE from 'three'

const PI2 = Math.PI * 2

const POINT_RESOLUTION_RATE = POINT_RESOLUTION / BASE_RESOLUTION

let canvas
let canvasWidth
let canvasHeight
let resolution
let gl

let planeIndex
let pointVBO
let popPointVBO

// matrix
const mat = new MatIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const vpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

let textures = {}
let prgs = {}
let postPrgs = {}

let media
let settings = {}
let pointResolution = [POINT_RESOLUTION, POINT_RESOLUTION]
let video
let videoResolution
let animation
let focusPosList = []
let focusCount
// let detectorMessage
let vbos = {}
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
let mode
let isChangeDeformation = false
let prevDeformationProgress = 0
let modelRadian = 0
let modelRadianTime = 0

// lighting
let lightDirection = [-0.5, 0.5, 0.5]
let eyeDirection = [cameraPosition.x, cameraPosition.y, cameraPosition.z]
let ambientColor = [0.1, 0.1, 0.1, 1]
let modelColor = [1, 1, 1, 1]

let loopCount = 0
let targetbufferIndex
let prevbufferIndex
let videoBufferIndex
let currentBufferIndex
let positionBufferIndex
let time

export async function run (options) {
  canvas = options.canvas
  settings = options.settings
  media = options.media

  gl = initWebGL(canvas)
  initCanvas()
  try {
    importShader()
  } catch (error) {
    throw error
  }
  initSettings()
  await initMedia()
  await initShader()
  resetFramebuffer()
  start()
}

function initCanvas () {
  // canvas element を取得しサイズをウィンドウサイズに設定
  function onResize () {
    canvasWidth = canvas.width
    canvasHeight = canvas.height
    resolution = [canvasWidth, canvasHeight]
  }
  initSize({ onResize })
  onResize()

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
}

/**
 * import shader source code
 */
function importShader () {
  function createVertexShader (vert) {
    return createShader(require(`../shader/${vert}.vert`), 'vertex')
  }

  const noneVs = createVertexShader('nothing')

  function createProgram (name, frag, vert = noneVs, prg = prgs) {
    const fs = createShader(require(`../shader/${frag}.frag`), 'fragment')
    prg[name] = new Program(vert, fs)
    if (!prg[name]) throw new Error('program error')
  }

  try {
    // video
    createProgram('video', 'video')

    // Post Effect
    createProgram('postVideo', 'post/video')

    const postVs = createVertexShader('post/post')
    for (const name of POST_LIST) {
      createProgram(name, `post/${name}`, postVs, postPrgs)
    }

    // Particle
    createProgram('particleVideo', 'particle/video')
    createProgram('picture', 'particle/picture')
    createProgram('reset', 'particle/reset')
    createProgram('position', 'particle/position')
    createProgram('velocity', 'particle/velocity')
    createProgram('particleScene', 'particle/scene', createVertexShader('particle/scene'))

    // Pop
    createProgram('popVelocity', 'particle/pop_velocity')
    createProgram('popPosition', 'particle/pop_position')
    createProgram('popScene', 'particle/pop_scene', createVertexShader('particle/pop_scene'))

    // render
    createProgram('scene', 'scene', createVertexShader('scene'))
  } catch (error) {
    throw error
  }
}

function initSettings () {
  deformationProgressTl = new Tween(settings, {
    property: 'deformationProgress',
    duration: 800,
    easing: 'easeInOutQuint',
    isAuto: false,
    onFinish: () => {
      isChangeDeformation = false
    }
  })

  // init settings
  Object.keys(settings).forEach(key => {
    update(key, settings[key])
  })

  focusCount = Math.min(focusPosList.length, 4)
}

async function initMedia () {
  // init media value
  video = media.currentVideo
  videoResolution = [video.videoWidth, video.videoHeight]
  videoZoom = settings.videoZoom
  settings.zoomPos = zoomPos

  // textures
  textures.video = createTexture(video)

  DEFORMATION_LIST.forEach(async ({ key, src }) => {
    if (!src) return
    textures[key] = await createTexture(src)
  })
}

async function initShader () {
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
  {
    const { vertices, count } = getPlaneVbo(POINT_RESOLUTION)
    pointVBO = vertices
    arrayLength = count
    vbos.video = pointVBO
  }

  // models

  // torus
  {
    const geometry = new THREE.TorusGeometry(TORUS_SIZE, 0.3 * TORUS_SIZE, 16, 100)
    const { vertices, normal } = getModelVbo(geometry, arrayLength)
    vbos.torus = vertices
    vbos.torusNormal = normal
  }

  // male
  {
    const geometry = await loadJSON('/src/visual/assets/models/Male02_dds.json')
    const { vertices, normal } = getModelVbo(geometry, arrayLength, MALE_SIZE, {
      x: 0,
      y: -1,
      z: 0
    })
    vbos.male = vertices
    vbos.maleNormal = normal
  }

  // pop
  {
    const { vertices, count } = getPointVbo(POP_RESOLUTION)
    popPointVBO = vertices
    popArrayLength = count
  }

  // video
  prgs.video.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  // Post Effect
  prgs.postVideo.createVariables({
    attribute: planeAttribute,
    uniform: {
      resolution: {
        type: '2fv'
      },
      videoResolution: {
        type: '2fv'
      },
      videoTexture: {
        type: '1i'
      }
    }
  })

  function setPostVariables (prg) {
    prg.createVariables({
      attribute: planeAttribute,
      uniform: {
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
      }
    })
  }
  for (const name of POST_LIST) {
    setPostVariables(postPrgs[name])
  }

  // Particle
  prgs.particleVideo.createVariables({
    attribute: planeAttribute,
    uniform: {
      resolution: {
        type: '2fv'
      },
      videoResolution: {
        type: '2fv'
      },
      videoTexture: {
        type: '1i'
      }
    }
  })

  prgs.picture.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  prgs.reset.createVariables({
    attribute: planeAttribute,
    uniform: {
      resolution: {
        type: '2fv'
      },
      z: {
        type: '1f'
      }
    }
  })

  prgs.velocity.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  prgs.position.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  prgs.particleScene.createVariables({
    attribute: {
      data: {
        stride: 4,
        vbo: vbos.video
      },
      torus: {
        stride: 4,
        vbo: vbos.torus
      },
      torusNormal: {
        stride: 3,
        vbo: vbos.torusNormal
      },
      male: {
        stride: 4,
        vbo: vbos.male
      },
      maleNormal: {
        stride: 3,
        vbo: vbos.maleNormal
      }
    },
    uniform: {
      mvpMatrix: {
        type: 'Matrix4fv'
      },
      invMatrix: {
        type: 'Matrix4fv'
      },
      lightDirection: {
        type: '3fv'
      },
      eyeDirection: {
        type: '3fv'
      },
      ambientColor: {
        type: '4fv'
      },
      pointSize: {
        type: '1f'
      },
      resolution: {
        type: '2fv'
      },
      videoResolution: {
        type: '2fv'
      },
      videoTexture: {
        type: '1i'
      },
      positionTexture: {
        type: '1i'
      },
      // logoTexture: {
      //   type: '1i'
      // },
      // logo2Texture: {
      //   type: '1i'
      // },
      // faceTexture: {
      //   type: '1i'
      // },
      time: {
        type: '1f'
      },
      bgColor: {
        type: '1f'
      },
      modelColor: {
        type: '4fv'
      },
      modelRadian: {
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
    }
  })

  // Pop
  prgs.popVelocity.createVariables({
    attribute: planeAttribute,
    uniform: {
      resolution: {
        type: '2fv'
      },
      prevVelocityTexture: {
        type: '1i'
      },
      pictureTexture: {
        type: '1i'
      }
    }
  })

  prgs.popPosition.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  prgs.popScene.createVariables({
    attribute: {
      data: {
        stride: 4,
        vbo: popPointVBO
      }
    },
    uniform: {
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
    }
  })

  // render
  prgs.scene.createVariables({
    attribute: planeAttribute,
    uniform: {
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
    }
  })

  // framebuffer

  // 拡張機能を有効化
  const ext = getWebGLExtensions()

  // video
  textures.videoBuffer = []
  for (var i = 0; i < VIDEO_FRAMEBUFFERS_COUNT; i++) {
    textures.videoBuffer.push(createFramebuffer(canvasWidth, canvasHeight))
  }

  // Post Effect
  textures.postVideo = createFramebuffer(canvasWidth, canvasHeight)
  textures.postScene = createFramebuffer(canvasWidth, canvasHeight)

  // effect 2
  textures.postSceneLast = createFramebuffer(canvasWidth, canvasHeight)

  // Particle
  textures.picture = []
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    textures.picture.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }

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

  // flags
  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE)
}

function resetFramebuffer () {
  // reset video
  gl.viewport(0, 0, canvasWidth, canvasWidth)
  useProgram(prgs.video)
  prgs.video.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      videoResolution,
      videoTexture: textures.video.index,
      zoom: videoZoom,
      zoomPos,
      focusCount,
      focusPos1: focusPosList[0] || defaultFocus,
      focusPos2: focusPosList[1] || defaultFocus,
      focusPos3: focusPosList[2] || defaultFocus,
      focusPos4: focusPosList[3] || defaultFocus
    }
  })
  for (let targetbufferIndex = 0; targetbufferIndex < VIDEO_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // video buffer
    bindFramebuffer(textures.videoBuffer[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset picture
  useProgram(prgs.picture)
  prgs.picture.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution: pointResolution,
      videoTexture: textures.video.index
    }
  })
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
  prgs.reset.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution: pointResolution
    }
  })
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetbufferIndex = 0; targetbufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // velocity buffer
    prgs.reset.setUniform('z', 0)
    bindFramebuffer(textures.velocity[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetbufferIndex = 0; targetbufferIndex < CAPTURE_FRAMEBUFFERS_COUNT; ++targetbufferIndex) {
    // position buffer
    prgs.reset.setUniform('z', 1)
    bindFramebuffer(textures.position[targetbufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset pop position
  useProgram(prgs.reset)
  prgs.reset.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution: [POP_RESOLUTION, POP_RESOLUTION],
      z: 1
    }
  })
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
}

function updateCamera () {
  const cameraPositionRate = settings.animation === 'warp' ? 1.5 : 0.3
  cameraPosition.x += (pointer.x * cameraPositionRate - cameraPosition.x) * 0.1
  cameraPosition.y += (pointer.y * cameraPositionRate - cameraPosition.y) * 0.1
  cameraPosition.z += (settings.zPosition - cameraPosition.z) * 0.1
  eyeDirection = [cameraPosition.x, cameraPosition.y, cameraPosition.z]

  mat.identity(mMatrix)
  mat.lookAt(
    [cameraPosition.x, cameraPosition.y, cameraPosition.z],
    [cameraPosition.x, cameraPosition.y, 0.0],
    [0.0, 1.0, 0.0],
    vMatrix
  )
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix)
  mat.multiply(pMatrix, vMatrix, vpMatrix)

  rotation.x = rotation.x % PI2
  rotation.y = rotation.y % PI2
  mat.rotate(mMatrix, rotation.x, [0.0, 1.0, 0.0], mMatrix)
  mat.rotate(mMatrix, rotation.y, [-1.0, 0.0, 0.0], mMatrix)
  mat.multiply(vpMatrix, mMatrix, mvpMatrix)
  mat.inverse(mMatrix, invMatrix)
}

function render () {
  targetbufferIndex = loopCount % 2
  prevbufferIndex = 1 - targetbufferIndex
  videoBufferIndex = isStop ? 4 : 2
  currentBufferIndex = isStop ? 4 : targetbufferIndex
  positionBufferIndex = isStop ? 2 : targetbufferIndex
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
  bindFramebuffer(textures.videoBuffer[2].framebuffer)
  prgs.video.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      videoResolution,
      videoTexture: textures.video.index,
      zoom: videoZoom,
      zoomPos,
      focusCount,
      focusPos1: focusPosList[0] || defaultFocus,
      focusPos2: focusPosList[1] || defaultFocus,
      focusPos3: focusPosList[2] || defaultFocus,
      focusPos4: focusPosList[3] || defaultFocus
    }
  })
  gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

  if (isCapture) {
    bindFramebuffer(textures.videoBuffer[4].framebuffer)
    prgs.video.setVariables({
      attribute: {
        position: null
      },
      uniform: {
        resolution,
        videoResolution,
        videoTexture: textures.video.index,
        zoom: videoZoom,
        zoomPos,
        focusCount,
        focusPos1: focusPosList[0] || defaultFocus,
        focusPos2: focusPosList[1] || defaultFocus,
        focusPos3: focusPosList[2] || defaultFocus,
        focusPos4: focusPosList[3] || defaultFocus
      }
    })
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  useProgram(prgs.postVideo)
  bindFramebuffer(textures.videoBuffer[3].framebuffer)
  prgs.postVideo.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      videoResolution,
      videoTexture: textures.videoBuffer[videoBufferIndex].index
    }
  })
  gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

  // Post Effect
  useProgram(prgs.currentPost)
  bindFramebuffer(textures.postScene.framebuffer)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, canvasWidth, canvasHeight)

  prgs.currentPost.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      texture: textures.videoBuffer[3].index,
      time,
      volume,
      isAudio,
      custom: settings.custom,
      customSwitch
    }
  })
  gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

  // effect 2
  useProgram(prgs.currentPost2)
  bindFramebuffer(textures.postSceneLast.framebuffer)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, canvasWidth, canvasHeight)

  prgs.currentPost2.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      texture: textures.postScene.index,
      time,
      volume,
      isAudio,
      custom: settings.custom,
      customSwitch
    }
  })
  gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

  if (settings.animation === 'normal' || settings.animation === 'warp' || settings.animation === 'pop') {
    useProgram(prgs.particleVideo)
    bindFramebuffer(textures.videoBuffer[targetbufferIndex].framebuffer)
    prgs.particleVideo.setVariables({
      attribute: {
        position: null
      },
      uniform: {
        resolution,
        videoResolution,
        videoTexture: textures.videoBuffer[videoBufferIndex].index
      }
    })
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

    // picture update
    useProgram(prgs.picture)
    bindFramebuffer(textures.picture[targetbufferIndex].framebuffer)
    prgs.picture.setVariables({
      attribute: {
        position: null
      },
      uniform: {
        resolution: pointResolution,
        videoTexture: textures.videoBuffer[targetbufferIndex].index,
        prevVideoTexture: textures.videoBuffer[prevbufferIndex].index,
        prevPictureTexture: textures.picture[prevbufferIndex].index
      }
    })
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (settings.animation === 'normal' || settings.animation === 'warp') {
      // Particle

      if (settings.deformation === 0) {
        // velocity update
        useProgram(prgs.velocity)
        bindFramebuffer(textures.velocity[targetbufferIndex].framebuffer)
        prgs.velocity.setVariables({
          attribute: {
            position: null
          },
          uniform: {
            resolution: pointResolution,
            prevVelocityTexture: textures.velocity[prevbufferIndex].index,
            pictureTexture: textures.picture[targetbufferIndex].index,
            animation,
            isAccel: settings.accel,
            isRotation: settings.rotation
          }
        })
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        // position update
        useProgram(prgs.position)
        bindFramebuffer(textures.position[targetbufferIndex].framebuffer)
        prgs.position.setVariables({
          attribute: {
            position: null
          },
          uniform: {
            resolution: pointResolution,
            prevPositionTexture: textures.position[prevbufferIndex].index,
            velocityTexture: textures.velocity[targetbufferIndex].index,
            pictureTexture: textures.picture[targetbufferIndex].index,
            animation
          }
        })
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        if (isCapture) {
          useProgram(prgs.position)
          bindFramebuffer(textures.position[positionBufferIndex].framebuffer)
          prgs.position.setVariables({
            attribute: {
              position: null
            },
            uniform: {
              resolution: pointResolution,
              prevPositionTexture: textures.position[prevbufferIndex].index,
              velocityTexture: textures.velocity[targetbufferIndex].index,
              pictureTexture: textures.picture[targetbufferIndex].index,
              animation
            }
          })
          gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
        }
      }

      gl[settings.deformation === 0 ? 'disable' : 'enable'](gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      useProgram(prgs.particleScene)
      bindFramebuffer(textures.particleScene.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      if (settings.deformation === 0 && !isChangeDeformation) {
        rotation.x += (pointer.x - rotation.x) * 0.02
      }
      rotation.y += (pointer.y - rotation.y) * 0.02
      updateCamera()

      if (settings.deformation === 0 && !isChangeDeformation) {
      } else if (isChangeDeformation) {
        const rate = Math.abs((1 - prevDeformationProgress) - settings.deformationProgress)
        modelRadianTime *= rate
        modelRadian *= rate
      } else {
        modelRadianTime += 1 / 60
        modelRadianTime %= PI2
        modelRadian = Math.sin(modelRadianTime) * 40 / 360 * PI2
      }

      prgs.particleScene.setVariables({
        attribute: {
          data: vbos.video,
          torus: null,
          torusNormal: null,
          male: null,
          maleNormal: null
        },
        uniform: {
          mvpMatrix,
          invMatrix,
          lightDirection,
          eyeDirection,
          ambientColor,
          pointSize,
          resolution,
          videoResolution,
          videoTexture: textures.videoBuffer[currentBufferIndex].index,
          positionTexture: textures.position[positionBufferIndex].index,
          time,
          bgColor: settings.bgColor,
          modelColor,
          modelRadian,
          volume,
          isAudio,
          mode,
          pointShape: settings.pointShape,
          prevDeformation,
          nextDeformation,
          deformationProgress: settings.deformationProgress,
          loopCount,
          animation
        }
      })
      DEFORMATION_LIST.forEach(({ key, src }) => {
        if (!src) return
        prgs.particleScene.setUniform(`${key}Texture`, textures[key].index)
      })
      gl.drawArrays(mode, 0, arrayLength)
    } else if (settings.animation === 'pop') {
      // Pop

      gl.viewport(0, 0, POP_RESOLUTION, POP_RESOLUTION)

      // velocity update
      useProgram(prgs.popVelocity)
      bindFramebuffer(textures.popVelocity[targetbufferIndex].framebuffer)
      prgs.popVelocity.setVariables({
        attribute: {
          position: null
        },
        uniform: {
          resolution: [POP_RESOLUTION, POP_RESOLUTION],
          prevVelocityTexture: textures.popVelocity[prevbufferIndex].index,
          pictureTexture: textures.picture[targetbufferIndex].index
        }
      })
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      // position update
      useProgram(prgs.popPosition)
      bindFramebuffer(textures.popPosition[targetbufferIndex].framebuffer)
      prgs.popPosition.setVariables({
        attribute: {
          position: null
        },
        uniform: {
          resolution: [POP_RESOLUTION, POP_RESOLUTION],
          prevPositionTexture: textures.popPosition[prevbufferIndex].index,
          velocityTexture: textures.popVelocity[targetbufferIndex].index,
          pictureTexture: textures.picture[targetbufferIndex].index
        }
      })
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      gl.enable(gl.BLEND)

      useProgram(prgs.popScene)
      bindFramebuffer(textures.particleScene.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      rotation.x += (pointer.x - rotation.x) * 0.01
      rotation.y += (pointer.y - rotation.y) * 0.01
      updateCamera()

      prgs.popScene.setVariables({
        attribute: {
          data: null
        },
        uniform: {
          mvpMatrix,
          resolution,
          pointSize,
          videoTexture: textures.videoBuffer[targetbufferIndex].index,
          positionTexture: textures.popPosition[targetbufferIndex].index,
          velocityTexture: textures.popVelocity[targetbufferIndex].index,
          bgColor: settings.bgColor,
          volume,
          isAudio,
          time
        }
      })
      gl.drawArrays(gl.POINTS, 0, popArrayLength)
    }
  }

  // mix video and particle
  useProgram(prgs.scene)
  bindFramebuffer(textures.lastPost.framebuffer)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, canvasWidth, canvasHeight)

  prgs.scene.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      particleTexture: textures.particleScene.index,
      postTexture: textures.postSceneLast.index,
      resolution,
      pointResolution,
      videoAlpha: settings.videoAlpha,
      particleAlpha: settings.particleAlpha,
      animation
    }
  })
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

  prgs.lastPost.setVariables({
    attribute: {
      position: null
    },
    uniform: {
      resolution,
      texture: textures.lastPost.index,
      time,
      volume,
      isAudio,
      custom: settings.custom,
      customSwitch
    }
  })
  gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

  gl.flush()

  isCapture = false

  // animation loop
  if (isRun) {
    ++loopCount
    requestAnimationFrame(render)
  }
}

export function update (property, value) {
  isChangeDeformation = true
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
    case 'mode':
      mode = gl[settings.mode || 'POINTS']
      break
    case 'pointSize':
      pointSize = settings.pointSize * canvasHeight / 930 / Math.pow(POINT_RESOLUTION_RATE, 0.4)
      break
    case 'deformation':
      prevDeformationProgress = deformationProgressTl.target.deformationProgress
      if (prevDeformationProgress === 1) {
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
