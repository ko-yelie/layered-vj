precision mediump float;
uniform sampler2D particleTexture;
uniform sampler2D postTexture;
uniform vec2      resolution;
uniform vec2      pointResolution;
uniform float videoAlpha;
uniform float particleAlpha;
uniform float animation;
varying vec2 vUv;

#pragma glslify: adjustRatio = require(./modules/ratio.glsl)

void main(){
  vec2 particleUv = mix(vUv, adjustRatio(vUv, resolution, pointResolution), step(animation, 1.));

  vec4 post = texture2D(postTexture, vUv);
  vec4 particle = texture2D(particleTexture, particleUv);

  gl_FragColor = post * videoAlpha * (1. - particle.w * particleAlpha) + particle * particle.w * particleAlpha;
}
