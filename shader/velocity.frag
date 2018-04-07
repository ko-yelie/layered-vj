/* ----------------------------------------------------------------------------
 * velocity update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D prevVelocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform float     time;
uniform vec2      mouse;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevVelocity = texture2D(prevVelocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);
  float velocityZ = (0.001 + prevVelocity.z) * (1. - picture.w);
  gl_FragColor = vec4(prevVelocity.xy, velocityZ, 0.0);
}
