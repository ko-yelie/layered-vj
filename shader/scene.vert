attribute vec2 texCoord;
uniform   mat4 mvpMatrix;
uniform   float size;
uniform sampler2D positionTexture;
uniform sampler2D capturedPositionTexture;
uniform   float volume;
uniform   float isStop;
uniform   float isAudio;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float pointSize = 8.;
void main(){
  vTexCoord = texCoord;
  vec4 position = mix(texture2D(positionTexture, texCoord), texture2D(capturedPositionTexture, vTexCoord), isStop);
  position.z = position.z * mix(1., volume / 255. * 2., isAudio);
  vPosition = position;
  gl_Position = mvpMatrix * vec4(position.xyz, 1.0);
  gl_PointSize = pointSize * (size / 930.) * position.z;
}
