precision highp float;

uniform sampler2D videoTexture;
uniform float     bgColor;
uniform float     time;
varying vec2 vTexCoord;
varying vec4 vPosition;

#pragma glslify: random = require(glsl-random)

const float amplitude = 0.1;
const float maxColor = 0.9;
const float minColor = 0.1;
const float minPopColor = 0.5;

float circle(vec2 st) {
  return 1. - step(1. - amplitude, length(st));
}

void main(){
  float rnd = random(vTexCoord);
  float randomTime = time * mix(0.5, 1., rnd);

  vec4 video = texture2D(videoTexture, vTexCoord);
  vec3 color = video.rgb * (maxColor - minColor) + minColor;

  vec2 pointCoord = gl_PointCoord.st * 2. - 1.;
  float distort = (sin(randomTime * 20.) * sin(pointCoord.y + sin(randomTime * 5.)) * 2. - 1.) * 0.05;
  pointCoord.x += distort;
  vec3 particleColor = vec3(
    circle(pointCoord - vec2(0., distort) * amplitude),
    circle(pointCoord + vec2(0., distort) * amplitude),
    circle(pointCoord + vec2(distort, 0.) * amplitude)
  );

  gl_FragColor = vec4(mix(vec3(minPopColor - minPopColor * (1. - bgColor)), vec3(1. - minPopColor * (1. - bgColor)), color) * particleColor, 1. - step(1., 1. - length(particleColor)));
}
