let canvas, gl

export function initWebGL (myCanvas) {
  canvas = myCanvas
  gl = canvas.getContext('webgl')
  return { canvas, gl }
}

export function createShader (source, type) {
  const shader = gl.createShader(type === 'vertex' ? gl.VERTEX_SHADER : type === 'fragment' ? gl.FRAGMENT_SHADER : null)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader))
    return
  }

  return shader
}

export class Program {
  constructor (vs, fs) {
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    this.program = program
    this.attributes = {}
    this.uniforms = {}
  }

  createAttribute (data) {
    Object.keys(data).forEach(name => {
      const { stride, vbo, ibo } = data[name]

      this.attributes[name] = {
        location: gl.getAttribLocation(this.program, name),
        stride,
        vbo,
        ibo
      }
      this.setAttribute(name)
    })
  }

  setAttribute (name, newVbo) {
    const { vbo, location, stride, ibo } = this.attributes[name]

    gl.bindBuffer(gl.ARRAY_BUFFER, newVbo || vbo)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
    ibo !== void 0 && gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  }

  createUniform (data) {
    Object.keys(data).forEach(name => {
      const uniform = data[name]

      this.uniforms[name] = {
        location: gl.getUniformLocation(this.program, name),
        type: `uniform${uniform.type}`
      }
      uniform.value !== void 0 && this.setUniform(name, uniform.value)
    })
  }

  setUniform (name, value) {
    const uniform = this.uniforms[name]
    if (!uniform) return

    if (/^uniformMatrix/.test(uniform.type)) {
      gl[uniform.type](uniform.location, false, value)
    } else {
      gl[uniform.type](uniform.location, value)
    }
  }
}

export function createVbo (data) {
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return vbo
}

export function createIbo (data) {
  let ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return ibo
}

export function bindTexture (texture, index = 0) {
  gl.activeTexture(gl.TEXTURE0 + index)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

export function createTexture (img, index) {
  const texture = gl.createTexture()
  bindTexture(texture, index)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  // gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  // gl.bindTexture(gl.TEXTURE_2D, null)
}

export function useProgram (prg) {
  gl.useProgram(prg.program)
}

export function bindFramebuffer (framebuffer) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
}

export function clearColor (...args) {
  gl.clearColor(...args)
}

export function loadImage (src, callback) {
  const img = new Image()
  img.addEventListener('load', () => {
    callback(img)
  })
  img.crossOrigin = 'anonymous'
  img.src = src
}

export function setSize (width = window.innerWidth, height = window.innerHeight) {
  const windowRatio = window.innerWidth / window.innerHeight
  const imgRatio = width / height

  if (imgRatio >= windowRatio) {
    canvas.width = window.innerWidth
    canvas.height = window.innerWidth / imgRatio
  } else {
    canvas.height = window.innerHeight
    canvas.width = window.innerHeight * imgRatio
  }

  gl.viewport(0, 0, canvas.width, canvas.height)
}

export function initSize (option = {}) {
  setSize(option.width, option.height)
  window.addEventListener('resize', () => {
    setSize(option.width, option.height)
    option.onResize && option.onResize()
  })
}

export function start (draw, mode, count) {
  function render (time) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    draw(time)

    gl.drawArrays(gl[mode], 0, count)

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

export function getPointVbo (interval) {
  let pointTexCoord = []
  for (let t = 0; t < 1; t += interval) {
    const back = t % (interval * 2) === interval
    for (let s = 0; s < 1; s += interval) {
      const cS = (back ? 1 : 0) + s * (back ? -1 : 1)
      pointTexCoord.push(cS, t, Math.random(), Math.random())
    }
  }
  return createVbo(pointTexCoord)
}
