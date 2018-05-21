precision highp float;

uniform sampler2D videoTexture;
uniform float     bgColor;
uniform float     time;
varying vec2 vTexCoord;
varying vec4 vPosition;

#pragma glslify: random = require(glsl-random)

const float amplitude = 0.1;
const float amplitude2 = amplitude * 2.;
const float maxColor = 0.9;
const float minColor = 0.1;
const float minPopColor = 0.5;
const float maxPopAlpha = 0.8;

float circle(vec2 st) {
  return 1. - step(1. - amplitude2, length(st));
}

void main(){
  float rnd = random(vTexCoord);
  float randomTime = time * mix(0.5, 1., rnd);

  vec4 video = texture2D(videoTexture, vTexCoord);
  vec3 color = video.rgb * (maxColor - minColor) + minColor;

  vec2 pointCoord = gl_PointCoord.st * 2. - 1.;
  float distortion = (sin(randomTime * 35.) * sin(pointCoord.y + sin(randomTime * 15.)) * 2. - 1.) * 0.05;
  pointCoord.x += distortion;
  float particleColor = 1. - step(length(vec2(
    circle(pointCoord - vec2(0., distortion) * amplitude),
    circle(pointCoord + vec2(-distortion, distortion) * amplitude)
  )), 0.);

  float minCurrentColor = mix(minPopColor, minPopColor * maxPopAlpha, bgColor);

  gl_FragColor = vec4(mix(vec3(minCurrentColor - minCurrentColor * (1. - bgColor)), vec3(1. - minCurrentColor * (1. - bgColor)), color), particleColor * mix(1., maxPopAlpha, bgColor));
}
