attribute vec2 texCoord;
uniform   mat4 mvpMatrix;
uniform   float pointSize;
uniform sampler2D positionTexture;
uniform sampler2D capturedPositionTexture;
uniform   float volume;
uniform   float isStop;
uniform   float isAudio;
uniform   float pointShape;
varying vec2 vTexCoord;
varying vec4 vPosition;
void main(){
  vTexCoord = texCoord;
  vec4 position = mix(texture2D(positionTexture, texCoord), texture2D(capturedPositionTexture, vTexCoord), isStop);
  position.z = position.z * mix(1., volume / 255. * 2., isAudio);
  vPosition = position;
  gl_Position = mvpMatrix * vec4(position.xyz, 1.0);
  gl_PointSize = position.z * pointSize * mix(mix(1., 1.3, pointShape), 4., step(2., pointShape));
}
