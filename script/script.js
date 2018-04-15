import matIV from './minMatrix.js';
import {
  setGl,
  ProgramParameter,
  loadShaderSource,
  createShader,
  createProgram,
  createVbo,
  createIbo,
  setAttribute,
  createFramebufferFloat,
  getWebGLExtensions
} from './utils.js';
import Media from './media.js';

let canvas;
let canvasWidth;
let canvasHeight;
let gl;
let ext;
let isRun;
let mat;
let textures = [];
let mouse = [0.0, 0.0];
let rotation = [0.0, 0.0];
let render
let media;

let scenePrg;
let videoPrg;
let picturePrg;
let resetPrg;
let positionPrg;
let velocityPrg;

const POINT_RESOLUTION = 128;
const VIDEO_BUFFER_INDEX = 1;
const PICTURE_BUFFER_INDEX = 3;
const POSITION_BUFFER_INDEX = 5;
const VELOCITY_BUFFER_INDEX = 7;

export default function run () {
  // canvas element を取得しサイズをウィンドウサイズに設定
  canvas = document.getElementById('canvas');
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // POINT_RESOLUTION = canvasWidth;

  // webgl コンテキストを初期化
  gl = canvas.getContext('webgl');
  if(gl == null){
    console.log('webgl unsupported');
    return;
  }
  setGl(gl)
  mat = new matIV();

  // 拡張機能を有効化
  ext = getWebGLExtensions();

  // Esc キーで実行を止められるようにイベントを設定
  window.addEventListener('keydown', (eve) => {
    if (eve.keyCode === 27) {
      isRun = !isRun
      isRun && render()
    }
  });

  window.addEventListener('mousemove', (eve) => {
    let x = (eve.clientX / canvasWidth) * 2.0 - 1.0;
    let y = (eve.clientY / canvasHeight) * 2.0 - 1.0;
    mouse = [x, -y];
  });

  // 外部ファイルのシェーダのソースを取得しプログラムオブジェクトを生成
  {
    let vs = createShader(require('../shader/scene.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/scene.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    scenePrg = new ProgramParameter(prg);
  }
  {
    let vs = createShader(require('../shader/video.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/video.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    videoPrg = new ProgramParameter(prg);
  }
  {
    let vs = createShader(require('../shader/picture.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/picture.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    picturePrg = new ProgramParameter(prg);
  }
  {
    let vs = createShader(require('../shader/reset.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/reset.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    resetPrg = new ProgramParameter(prg);
  }
  {
    let vs = createShader(require('../shader/position.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/position.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    positionPrg = new ProgramParameter(prg);
  }
  {
    let vs = createShader(require('../shader/velocity.vert'), gl.VERTEX_SHADER);
    let fs = createShader(require('../shader/velocity.frag'), gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    if(prg == null){return;}
    velocityPrg = new ProgramParameter(prg);
  }

  media = new Media(POINT_RESOLUTION)
  media.promise.then(init)
}

function init(video){
  // scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'position');
  scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'texCoord');
  // scenePrg.attStride[0]   = 3;
  scenePrg.attStride[0]   = 2;
  scenePrg.uniLocation[0] = gl.getUniformLocation(scenePrg.program, 'mvpMatrix');
  scenePrg.uniLocation[1] = gl.getUniformLocation(scenePrg.program, 'size');
  scenePrg.uniLocation[2] = gl.getUniformLocation(scenePrg.program, 'videoTexture');
  scenePrg.uniLocation[3] = gl.getUniformLocation(scenePrg.program, 'positionTexture');
  scenePrg.uniLocation[4] = gl.getUniformLocation(scenePrg.program, 'bgColor');
  scenePrg.uniLocation[5] = gl.getUniformLocation(scenePrg.program, 'volume');
  scenePrg.uniType[0]   = 'uniformMatrix4fv';
  scenePrg.uniType[1]   = 'uniform1f';
  scenePrg.uniType[2]   = 'uniform1i';
  scenePrg.uniType[3]   = 'uniform1i';
  scenePrg.uniType[4]   = 'uniform1f';
  scenePrg.uniType[5]   = 'uniform1f';

  videoPrg.attLocation[0] = gl.getAttribLocation(videoPrg.program, 'position');
  videoPrg.attStride[0]   = 3;
  videoPrg.uniLocation[0] = gl.getUniformLocation(videoPrg.program, 'resolution');
  videoPrg.uniLocation[1] = gl.getUniformLocation(videoPrg.program, 'videoTexture');
  videoPrg.uniType[0]   = 'uniform2fv';
  videoPrg.uniType[1]   = 'uniform1i';

  picturePrg.attLocation[0] = gl.getAttribLocation(picturePrg.program, 'position');
  picturePrg.attStride[0]   = 3;
  picturePrg.uniLocation[0] = gl.getUniformLocation(picturePrg.program, 'resolution');
  picturePrg.uniLocation[1] = gl.getUniformLocation(picturePrg.program, 'videoTexture');
  picturePrg.uniLocation[2] = gl.getUniformLocation(picturePrg.program, 'prevVideoTexture');
  picturePrg.uniLocation[3] = gl.getUniformLocation(picturePrg.program, 'prevPictureTexture');
  picturePrg.uniType[0]   = 'uniform2fv';
  picturePrg.uniType[1]   = 'uniform1i';
  picturePrg.uniType[2]   = 'uniform1i';
  picturePrg.uniType[3]   = 'uniform1i';

  resetPrg.attLocation[0] = gl.getAttribLocation(resetPrg.program, 'position');
  resetPrg.attStride[0]   = 3;
  resetPrg.uniLocation[0] = gl.getUniformLocation(resetPrg.program, 'resolution');
  resetPrg.uniLocation[1] = gl.getUniformLocation(resetPrg.program, 'videoTexture');
  resetPrg.uniType[0]   = 'uniform2fv';
  resetPrg.uniType[1]   = 'uniform1i';

  velocityPrg.attLocation[0] = gl.getAttribLocation(velocityPrg.program, 'position');
  velocityPrg.attStride[0]   = 3;
  velocityPrg.uniLocation[0] = gl.getUniformLocation(velocityPrg.program, 'prevVelocityTexture');
  velocityPrg.uniLocation[1] = gl.getUniformLocation(velocityPrg.program, 'pictureTexture');
  velocityPrg.uniLocation[2] = gl.getUniformLocation(velocityPrg.program, 'resolution');
  velocityPrg.uniLocation[3] = gl.getUniformLocation(velocityPrg.program, 'mouse');
  velocityPrg.uniType[0]   = 'uniform1i';
  velocityPrg.uniType[1]   = 'uniform1i';
  velocityPrg.uniType[2]   = 'uniform2fv';
  velocityPrg.uniType[3]   = 'uniform2fv';

  positionPrg.attLocation[0] = gl.getAttribLocation(positionPrg.program, 'position');
  positionPrg.attStride[0]   = 3;
  positionPrg.uniLocation[0] = gl.getUniformLocation(positionPrg.program, 'prevPositionTexture');
  positionPrg.uniLocation[1] = gl.getUniformLocation(positionPrg.program, 'velocityTexture');
  positionPrg.uniLocation[2] = gl.getUniformLocation(positionPrg.program, 'pictureTexture');
  positionPrg.uniLocation[3] = gl.getUniformLocation(positionPrg.program, 'resolution');
  positionPrg.uniType[0]   = 'uniform1i';
  positionPrg.uniType[1]   = 'uniform1i';
  positionPrg.uniType[2]   = 'uniform1i';
  positionPrg.uniType[3]   = 'uniform2fv';

  const sWidth = 256;
  const tHeight = 256;
  const sInterval = (sWidth / POINT_RESOLUTION) / sWidth;
  const tInterval = (tHeight / POINT_RESOLUTION) / tHeight;

  let pointTexCoord = [];
  for(let t = 0; t < 1; t += tInterval){
    const back = t % (tInterval * 2) === tInterval;
    for(let s = 0; s < 1; s += sInterval){
      const cS = (back ? 1 : 0) + s * (back ? -1 : 1);
      pointTexCoord.push(cS, t);
    }
  }
  const pointVBO = [createVbo(pointTexCoord)];

  pointTexCoord = [];
  for(let t = 0; t < 1 - tInterval; t += tInterval){
    for(let s = 0; s < 1; s += sInterval){
      if (s === sWidth - sInterval) {
        pointTexCoord.push(s, t);
        pointTexCoord.push(s, t + tInterval);
      } else {
        pointTexCoord.push(s, t);
        pointTexCoord.push(s, t + tInterval);
        pointTexCoord.push(s + sInterval, t + tInterval);
        pointTexCoord.push(s, t);
      }
    }
  }
  const meshPointVBO = [createVbo(pointTexCoord)];

  // vertices
  let planePosition = [
     1.0,  1.0,  0.0,
    -1.0,  1.0,  0.0,
     1.0, -1.0,  0.0,
    -1.0, -1.0,  0.0
  ];
  let planeTexCoord = [
    1.0, 0.0,
    0.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ];
  let planeIndex = [
    0, 1, 2, 2, 1, 3
  ];
  let planeVBO = [createVbo(planePosition)];
  let planeIBO = createIbo(planeIndex);
  let planeTexCoordVBO = [
    createVbo(planePosition),
    createVbo(planeTexCoord)
  ];

  // matrix
  let mMatrix    = mat.identity(mat.create());
  let vMatrix    = mat.identity(mat.create());
  let pMatrix    = mat.identity(mat.create());
  let vpMatrix   = mat.identity(mat.create());
  let mvpMatrix  = mat.identity(mat.create());
  mat.lookAt([0.0, 0.0, 5.0 / (sWidth / POINT_RESOLUTION)], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix);
  mat.multiply(pMatrix, vMatrix, vpMatrix);

  // framebuffer
  let videoFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ];
  let pictureFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ];

  let velocityFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ];
  let positionFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ];

  // textures
  gl.activeTexture(gl.TEXTURE0 + VIDEO_BUFFER_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, videoFramebuffers[0].texture);
  gl.activeTexture(gl.TEXTURE0 + VIDEO_BUFFER_INDEX + 1);
  gl.bindTexture(gl.TEXTURE_2D, videoFramebuffers[1].texture);
  gl.activeTexture(gl.TEXTURE0 + PICTURE_BUFFER_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, pictureFramebuffers[0].texture);
  gl.activeTexture(gl.TEXTURE0 + PICTURE_BUFFER_INDEX + 1);
  gl.bindTexture(gl.TEXTURE_2D, pictureFramebuffers[1].texture);
  gl.activeTexture(gl.TEXTURE0 + POSITION_BUFFER_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[0].texture);
  gl.activeTexture(gl.TEXTURE0 + POSITION_BUFFER_INDEX + 1);
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[1].texture);
  gl.activeTexture(gl.TEXTURE0 + VELOCITY_BUFFER_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, velocityFramebuffers[0].texture);
  gl.activeTexture(gl.TEXTURE0 + VELOCITY_BUFFER_INDEX + 1);
  gl.bindTexture(gl.TEXTURE_2D, velocityFramebuffers[1].texture);

  // reset video
  gl.useProgram(videoPrg.program);
  gl[videoPrg.uniType[0]](videoPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
  gl[videoPrg.uniType[1]](videoPrg.uniLocation[1], 0);
  setAttribute(planeVBO, videoPrg.attLocation, videoPrg.attStride, planeIBO);
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);
  for(let targetBufferIndex = 0; targetBufferIndex <= 1; ++targetBufferIndex){
    // video buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, videoFramebuffers[targetBufferIndex].framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }

  // video texture
  var videoTexture = gl.createTexture(gl.TEXTURE_2D);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // reset picture
  gl.useProgram(picturePrg.program);
  gl[picturePrg.uniType[0]](picturePrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
  gl[picturePrg.uniType[1]](picturePrg.uniLocation[1], 0);
  setAttribute(planeVBO, picturePrg.attLocation, picturePrg.attStride);
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);
  for(let targetBufferIndex = 0; targetBufferIndex <= 1; ++targetBufferIndex){
    // picture buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, pictureFramebuffers[targetBufferIndex].framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }

  // reset particle position
  gl.useProgram(resetPrg.program);
  gl[resetPrg.uniType[0]](resetPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
  gl[resetPrg.uniType[1]](resetPrg.uniLocation[1], 0);
  setAttribute(planeVBO, resetPrg.attLocation, resetPrg.attStride, planeIBO);
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);
  for(let targetBufferIndex = 0; targetBufferIndex <= 1; ++targetBufferIndex){
    // velocity buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFramebuffers[targetBufferIndex].framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
    // position buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[targetBufferIndex].framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }

  // flags
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

  // control
  const data = {
    mode: 'points',
    shape: 'line',
    bgColor: 'black'
  }

  let mode
  let vbo
  let arrayLength
  let bgColor

  const gui = new dat.GUI()

  function changeMode (val) {
    switch (val) {
    case 'line_strip':
      mode = gl.LINE_STRIP
      break
    case 'triangles':
      mode = gl.TRIANGLES
      break
    case 'points':
    default:
      mode = gl.POINTS
    }
  }
  gui.add(data, 'mode', ['points', 'line_strip', 'triangles']).onChange(changeMode)
  changeMode(data.mode)

  function changeShape (val) {
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
  gui.add(data, 'shape', ['line', 'mesh']).onChange(changeShape)
  changeShape(data.shape)

  function changeBgColor (val) {
    switch (val) {
    case 'white':
      bgColor = 1
      break
    case 'black':
    default:
      bgColor = 0
    }
    let rgbInt = bgColor * 255
    canvas.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
  }
  gui.add(data, 'bgColor', ['black', 'white']).onChange(changeBgColor)
  changeBgColor(data.bgColor)

  // setting
  let loopCount = 0;
  isRun = true;

  render = () => {
    let targetBufferIndex = loopCount % 2;
    let prevBufferIndex = 1 - targetBufferIndex;

    const volume = media.update()

    // video texture
    var videoTexture = gl.createTexture(gl.TEXTURE_2D);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);

    // video update
    gl.useProgram(videoPrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, videoFramebuffers[targetBufferIndex].framebuffer);
    setAttribute(planeVBO, videoPrg.attLocation, videoPrg.attStride, planeIBO);
    gl[videoPrg.uniType[0]](videoPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
    gl[videoPrg.uniType[1]](videoPrg.uniLocation[1], 0);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);

    // picture update
    gl.useProgram(picturePrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pictureFramebuffers[targetBufferIndex].framebuffer);
    setAttribute(planeVBO, picturePrg.attLocation, picturePrg.attStride);
    gl[picturePrg.uniType[0]](picturePrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
    gl[picturePrg.uniType[1]](picturePrg.uniLocation[1], VIDEO_BUFFER_INDEX + targetBufferIndex);
    gl[picturePrg.uniType[2]](picturePrg.uniLocation[2], VIDEO_BUFFER_INDEX + prevBufferIndex);
    gl[picturePrg.uniType[3]](picturePrg.uniLocation[3], PICTURE_BUFFER_INDEX + prevBufferIndex);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);

    // velocity update
    gl.useProgram(velocityPrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFramebuffers[targetBufferIndex].framebuffer);
    setAttribute(planeVBO, velocityPrg.attLocation, velocityPrg.attStride, planeIBO);
    gl[velocityPrg.uniType[0]](velocityPrg.uniLocation[0], VELOCITY_BUFFER_INDEX + prevBufferIndex);
    gl[velocityPrg.uniType[1]](velocityPrg.uniLocation[1], PICTURE_BUFFER_INDEX + prevBufferIndex);
    gl[velocityPrg.uniType[2]](velocityPrg.uniLocation[2], [POINT_RESOLUTION, POINT_RESOLUTION]);
    gl[velocityPrg.uniType[3]](velocityPrg.uniLocation[3], mouse);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
    // position update
    gl.useProgram(positionPrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[targetBufferIndex].framebuffer);
    setAttribute(planeVBO, positionPrg.attLocation, positionPrg.attStride, planeIBO);
    gl[positionPrg.uniType[0]](positionPrg.uniLocation[0], POSITION_BUFFER_INDEX + prevBufferIndex);
    gl[positionPrg.uniType[1]](positionPrg.uniLocation[1], VELOCITY_BUFFER_INDEX + targetBufferIndex);
    gl[positionPrg.uniType[2]](positionPrg.uniLocation[2], PICTURE_BUFFER_INDEX + targetBufferIndex);
    gl[positionPrg.uniType[3]](positionPrg.uniLocation[3], [POINT_RESOLUTION, POINT_RESOLUTION]);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND);
    gl.useProgram(scenePrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    setAttribute(vbo, scenePrg.attLocation, scenePrg.attStride);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    // push and render
    rotation[0] += (mouse[0] - rotation[0]) * 0.05
    rotation[1] += (mouse[1] - rotation[1]) * 0.05
    mat.identity(mMatrix);
    mat.rotate(mMatrix, rotation[0], [0.0, 1.0, 0.0], mMatrix);
    mat.rotate(mMatrix, rotation[1], [-1.0, 0.0, 0.0], mMatrix);
    mat.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl[scenePrg.uniType[0]](scenePrg.uniLocation[0], false, mvpMatrix);
    gl[scenePrg.uniType[1]](scenePrg.uniLocation[1], canvasHeight);
    gl[scenePrg.uniType[2]](scenePrg.uniLocation[2], VIDEO_BUFFER_INDEX + targetBufferIndex);
    gl[scenePrg.uniType[3]](scenePrg.uniLocation[3], POSITION_BUFFER_INDEX + targetBufferIndex);
    gl[scenePrg.uniType[4]](scenePrg.uniLocation[4], bgColor);
    gl[scenePrg.uniType[5]](scenePrg.uniLocation[5], volume);
    // gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
    gl.drawArrays(mode, 0, arrayLength);

    gl.flush();

    ++loopCount;

    // animation loop
    if(isRun){requestAnimationFrame(render);}
  }

  render()
}
