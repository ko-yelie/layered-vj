precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
const float maxZ = 1.;
const float minZ = 0.3;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevPosition = texture2D(prevPositionTexture, coord);
  vec4 velocity = texture2D(velocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);
  float color = picture.x + picture.y + picture.z;
  float startZ = color / 3. * (maxZ - minZ) + minZ;
  float z = mix(prevPosition.z - velocity.z, startZ, picture.w);
  gl_FragColor = vec4(prevPosition.xy, z, mix(prevPosition.w, startZ, picture.w));
}
