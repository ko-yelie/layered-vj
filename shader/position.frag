/* ----------------------------------------------------------------------------
 * position update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform float     animation;
const float minZ = 0.2;
const float height = 0.5;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevPosition = texture2D(prevPositionTexture, coord);
  vec4 velocity = texture2D(velocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);
  float color = picture.x + picture.y + picture.z;
  float isAnimation1 = step(animation, 0.);
  float animation1Z = height * picture.w + (prevPosition.z - velocity.z) * (1. - picture.w);
  float animation2Z = step(0.01, color) * minZ + color * 0.3;
  float z = animation1Z * isAnimation1 + animation2Z * (1. - isAnimation1);
  gl_FragColor = vec4(prevPosition.xy, z, prevPosition.w);
}
