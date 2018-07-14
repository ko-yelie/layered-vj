/* eslint-disable */
let gl

export function setGl(newGl){
  gl = newGl
}

/**
 * プログラムオブジェクトやシェーダに関するパラメータを格納するためのクラス
 * @class
 */
export class ProgramParameter {
  constructor(program){
    this.program   = program
    this.attLocation = []
    this.attStride   = []
    this.uniLocation = []
    this.uniType   = []
  }
}

/**
 * XHR でシェーダのソースコードを外部ファイルから取得しコールバックを呼ぶ。
 * @param {string} vsPath - 頂点シェーダの記述されたファイルのパス
 * @param {string} fsPath - フラグメントシェーダの記述されたファイルのパス
 * @param {function} callback - コールバック関数
 */
export function loadShaderSource(vsPath, fsPath, callback){
  let vs, fs
  xhr(vsPath, true)
  xhr(fsPath, false)
  function xhr(source, isVertex){
    let xml = new XMLHttpRequest()
    xml.open('GET', source, true)
    xml.setRequestHeader('Pragma', 'no-cache')
    xml.setRequestHeader('Cache-Control', 'no-cache')
    xml.onload = () => {
      if(isVertex){
        vs = xml.responseText
      }else{
        fs = xml.responseText
      }
      if(vs != null && fs != null){
        console.log('loaded', vsPath, fsPath)
        callback({vs: vs, fs: fs})
      }
    }
    xml.send()
  }
}

/**
 * シェーダオブジェクトを生成して返す。
 * コンパイルに失敗した場合は理由をアラートし null を返す。
 * @param {string} source - シェーダのソースコード文字列
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @return {WebGLShader} シェーダオブジェクト
 */
export function createShader(source, type){
  let shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
    return shader
  }else{
    alert(gl.getShaderInfoLog(shader))
    return null
  }
}

/**
 * プログラムオブジェクトを生成して返す。
 * シェーダのリンクに失敗した場合は理由をアラートし null を返す。
 * @param {WebGLShader} vs - 頂点シェーダオブジェクト
 * @param {WebGLShader} fs - フラグメントシェーダオブジェクト
 * @return {WebGLProgram} プログラムオブジェクト
 */
export function createProgram(vs, fs){
  if(vs == null || fs == null){return;}
  let program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if(gl.getProgramParameter(program, gl.LINK_STATUS)){
    gl.useProgram(program)
    return program
  }else{
    alert(gl.getProgramInfoLog(program))
    return null
  }
}

/**
 * VBO を生成して返す。
 * @param {Array} data - 頂点属性データを格納した配列
 * @return {WebGLBuffer} VBO
 */
export function createVbo(data){
  let vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return vbo
}

/**
 * IBO を生成して返す。
 * @param {Array} data - インデックスデータを格納した配列
 * @return {WebGLBuffer} IBO
 */
export function createIbo(data){
  let ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return ibo
}

/**
 * IBO を生成して返す。(INT 拡張版)
 * @param {Array} data - インデックスデータを格納した配列
 * @return {WebGLBuffer} IBO
 */
export function createIboInt(data){
  let ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return ibo
}

/**
 * VBO を IBO をバインドし有効化する。
 * @param {Array} vbo - VBO を格納した配列
 * @param {Array} attL - attribute location を格納した配列
 * @param {Array} attS - attribute stride を格納した配列
 * @param {WebGLBuffer} ibo - IBO
 */
export function setAttribute(vbo, attL, attS, ibo){
  for(let i in vbo){
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i])
    gl.enableVertexAttribArray(attL[i])
    gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0)
  }
  if(ibo != null){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  }
}

/**
 * 画像ファイルを読み込み、テクスチャを生成してコールバックで返却する。
 * @param {string} source - ソースとなる画像のパス
 * @param {function} callback - コールバック関数（第一引数にテクスチャオブジェクトが入った状態で呼ばれる）
 */
export function createTexture(source, callback){
  let img = new Image()
  img.addEventListener('load', () => {
    let tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.bindTexture(gl.TEXTURE_2D, null)
    callback(tex)
  }, false)
  img.src = source
}

/**
 * フレームバッファを生成して返す。
 * @param {number} width - フレームバッファの幅
 * @param {number} height - フレームバッファの高さ
 * @return {object} 生成した各種オブジェクトはラップして返却する
 * @property {WebGLFramebuffer} framebuffer - フレームバッファ
 * @property {WebGLRenderbuffer} renderbuffer - 深度バッファとして設定したレンダーバッファ
 * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
 */
export function createFramebuffer(width, height){
  let frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  let depthRenderBuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer)
  let fTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, fTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return {framebuffer: frameBuffer, renderbuffer: depthRenderBuffer, texture: fTexture}
}

/**
 * フレームバッファを生成して返す。（フロートテクスチャ版）
 * @param {object} ext - getWebGLExtensions の戻り値
 * @param {number} width - フレームバッファの幅
 * @param {number} height - フレームバッファの高さ
 * @return {object} 生成した各種オブジェクトはラップして返却する
 * @property {WebGLFramebuffer} framebuffer - フレームバッファ
 * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
 */
export function createFramebufferFloat(ext, width, height){
  if(ext == null || (ext.textureFloat == null && ext.textureHalfFloat == null)){
    console.log('float texture not support')
    return
  }
  let flg = (ext.textureFloat != null) ? gl.FLOAT : ext.textureHalfFloat.HALF_FLOAT_OES
  let frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  let fTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, fTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return {framebuffer: frameBuffer, texture: fTexture}
}

/**
 * 主要な WebGL の拡張機能を取得する。
 * @return {object} 取得した拡張機能
 * @property {object} elementIndexUint - Uint32 フォーマットを利用できるようにする
 * @property {object} textureFloat - フロートテクスチャを利用できるようにする
 * @property {object} textureHalfFloat - ハーフフロートテクスチャを利用できるようにする
 */
export function getWebGLExtensions(){
  return {
    elementIndexUint: gl.getExtension('OES_element_index_uint'),
    textureFloat:   gl.getExtension('OES_texture_float'),
    textureHalfFloat: gl.getExtension('OES_texture_half_float')
  }
}
