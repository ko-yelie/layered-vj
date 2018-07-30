precision mediump float;
uniform sampler2D texture;
uniform float     time;
uniform vec2      resolution;
uniform float     volume;
uniform float     isAudio;
varying vec2      vUv;

#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

const float interval = 3.;
const float divisionPx = 8.;
const float deflection = 0.01;
const float rgbDiff = 0.5;

void main(){
  float rnd = random(vec2(time));
  float modTime = mod(time, interval);
  float regularBomb = smoothstep(interval - 0.3 * 2., interval - 0.3, modTime) * (1. - smoothstep(interval - 0.3, interval, modTime)) * 0.05;
  float strength = (rnd * 2. - 1.) * ((1. - isAudio) * regularBomb + isAudio * (volume - 1.) * 0.02);

  float yRnd = random(vec2(0., floor(vUv.y * resolution.y / divisionPx)) + mod(time, 10.));
  vec2 uv = vec2(vUv.x + (yRnd * 2. - 1.) * deflection * (strength + rnd * 0.4), vUv.y);

  uv += strength * 3. * (snoise2(vUv * rnd * 10.) * 2. - 1.);
  float cRgbDiff = rgbDiff * (strength + rnd * 0.02);
  float r = texture2D(texture, vec2(uv.x + cRgbDiff, uv.y)).r;
  float g = texture2D(texture, vec2(uv.x, uv.y)).g;
  float b = texture2D(texture, vec2(uv.x - cRgbDiff, uv.y)).b;
  vec3 color = vec3(r, g, b);

  vec2 nUv = vUv * 2. - 1.;

  float vignette = 1.5 - length(nUv);
  color *= vignette;

  float scanLine = abs(sin(gl_FragCoord.y + time * 0.8)) * 0.5 + 0.5;
  color *= scanLine;

  gl_FragColor = vec4(color, 1.0);
}
