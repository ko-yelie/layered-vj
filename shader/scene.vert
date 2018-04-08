attribute vec2 texCoord;
uniform   mat4 mvpMatrix;
uniform   float size;
uniform sampler2D positionTexture;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float pointSize = 10.;
void main(){
  vTexCoord = texCoord;
  vec4 position = texture2D(positionTexture, texCoord);
  vPosition = position;
  gl_Position = mvpMatrix * vec4(position.xyz, 1.0);
  gl_PointSize = pointSize * (size / 930.) * position.z;
}
