precision highp float;
uniform sampler2D videoTexture;
uniform sampler2D capturedVideoTexture;
uniform float     bgColor;
uniform float     isStop;
varying vec2 vTexCoord;
varying vec4 vPosition;
const float maxColor = 0.9;
const float minColor = 0.1;
void main(){
  vec4 video = mix(texture2D(videoTexture, vTexCoord), texture2D(capturedVideoTexture, vTexCoord), isStop);
  float rate = vPosition.z / vPosition.w;
  vec3 color = video.rgb * (maxColor - minColor) + minColor;
  gl_FragColor = vec4(color + maxColor * (1. - rate) * mix(-1., 1., bgColor), rate);
}
