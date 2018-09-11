precision mediump float;
uniform vec2      resolution;
uniform vec2      videoResolution;
uniform sampler2D videoTexture;

#pragma glslify: adjustRatio = require(../modules/ratio.glsl)

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec2 uv = adjustRatio(coord, videoResolution, vec2(1.));
  gl_FragColor = texture2D(videoTexture, uv);
}
