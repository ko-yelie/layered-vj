precision mediump float;
uniform sampler2D texture;
uniform float     time;
uniform vec2      resolution;
uniform float     volume;
uniform float     custom;
uniform float     customSwitch;
varying vec2      vUv;

#pragma glslify: random = require(glsl-random)
#pragma glslify: hsv = require(../modules/color.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.0;
const float interval = 2.;
const float count = 8.;
const float shakeRate = 0.36;

void main(){
  float stepTime = floor(mod(time, interval) / interval * count) / count;

  vec4 video = texture2D(texture, vUv);
  float noise = stepTime;
  float rndX = random(vec2(noise, 0.));
  float rndY = random(vec2(0., noise));
  vec4 shakeVideo = texture2D(texture, vUv + (vec2(rndX, rndY) * 2. - 1.) * (customSwitch == 1. ? 0.05 : 0.005));

  gl_FragColor = video * (1. - shakeRate) + shakeVideo * shakeRate;
}
