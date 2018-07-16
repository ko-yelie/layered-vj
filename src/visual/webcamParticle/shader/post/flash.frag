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
const float interval = 4.8;
const float count = 8.;

void main(){
  vec4 video = texture2D(texture, vUv);

  float stepTime = floor(mod(time, interval) / interval * count) / count;
  vec3 offRgb = hsv(stepTime * PI2, 0.7, 1.);
  vec4 offColor = vec4(offRgb, 1.);

  float rnd = random(vec2(time));
  float mixedRnd = mix(0.7, 1., rnd);
  vec3 onRgb = hsv(rnd * PI2, mixedRnd, mixedRnd);
  onRgb = mix(vec3(0.7), vec3(1.), onRgb);
  vec4 onColor = vec4(onRgb, mix(0.4, 1.2, rnd));

  gl_FragColor = video * mix(offColor, onColor, customSwitch);
}
