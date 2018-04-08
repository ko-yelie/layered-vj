/* ----------------------------------------------------------------------------
 * scene shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D videoTexture;
uniform float     bgColor;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float maxColor = 0.9;
const float minColor = 0.1;
void main(){
  vec4 video = texture2D(videoTexture, vTexCoord);
  float rate = vPosition.z / vPosition.w;
  vec3 color = video.rgb * (maxColor - minColor) + minColor;
  gl_FragColor = vec4(color + maxColor * (1. - rate) * (-1. * (1. - bgColor) + 1. * bgColor), rate);
}
