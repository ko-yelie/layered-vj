#pragma glslify: random = require(glsl-random)

precision mediump float;
uniform sampler2D texture;
uniform float     time;
varying vec2      vUv;

void main(){
  float n = random(gl_FragCoord.st + mod(time, 10.0));
  n = n * 0.2 + 0.8;

  gl_FragColor = texture2D(texture, vUv) * vec4(vec3(n), 1.0);
}
