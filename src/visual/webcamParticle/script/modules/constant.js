export const VIDEO_RESOLUTION = 416
export const POINT_RESOLUTION = 128
export const POP_RESOLUTION = 16
export const BASE_RESOLUTION = 128

export const MIN_ZOOM = 2
export const MAX_ZOOM = 10

export const MIN_VIDEO_ZOOM = 1
export const MAX_VIDEO_ZOOM = 3

export const GPGPU_FRAMEBUFFERS_COUNT = 2
export const CAPTURE_FRAMEBUFFERS_COUNT = 3
export const VIDEO_FRAMEBUFFERS_COUNT = 5

export const MODE_LIST = [
  'POINTS',
  'LINE_STRIP',
  'TRIANGLES'
]

export const POST_LIST = [
  'none',
  'binary',
  'rock',
  'toon',
  'water',
  'glitch',
  'dorolitch',
  'dot',
  'dotScreen',
  'shake',
  'flash'
]

export const DEFORMATION_LIST = [
  {
    key: 'video',
    value: 0
  },
  {
    key: 'circle',
    value: 1
  },
  {
    key: 'sphere',
    value: 5
  },
  {
    key: 'torus',
    value: 2
  },
  {
    key: 'male',
    value: 3
  },
  {
    key: 'text',
    value: 4
  }
]

export const NOISE_LIST = [
  {
    key: 'none',
    value: 0
  },
  {
    key: 'random',
    value: 1
  },
  {
    key: 'simplex',
    value: 2
  }
]

export const MODEL_SIZE = 0.8
export const MALE_SIZE = 0.012
