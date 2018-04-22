attribute vec2 texCoord;
uniform   mat4 mvpMatrix;
uniform   float size;
uniform sampler2D positionTexture;
uniform sampler2D capturedPositionTexture;
uniform   float volume;
uniform   float isStop;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float pointSize = 10.;
void main(){
  vTexCoord = texCoord;
  vec4 position = texture2D(positionTexture, texCoord) * step(isStop, 0.) + texture2D(capturedPositionTexture, vTexCoord) * step(1., isStop);
  position.z = position.z * volume / 255. * 2.;
  vPosition = position;
  gl_Position = mvpMatrix * vec4(position.xyz, 1.0);
  gl_PointSize = pointSize * (size / 930.) * position.z;
}
