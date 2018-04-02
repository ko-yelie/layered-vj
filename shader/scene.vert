attribute vec2 texCoord;
uniform   mat4 mvpMatrix;
uniform sampler2D positionTexture;
uniform vec2 resolution;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float pointSize = 5.;
void main(){
  vTexCoord = texCoord;
  vec4 position = texture2D(positionTexture, texCoord);
  vPosition = position;
  gl_Position = mvpMatrix * vec4(position.xyz, 1.0);
  gl_PointSize = pointSize * position.z;
}
