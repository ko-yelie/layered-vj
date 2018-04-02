/* ----------------------------------------------------------------------------
 * scene shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D videoTexture;
varying vec2 vTexCoord;
varying vec4 vPosition;
void main(){
  vec4 video = texture2D(videoTexture, vTexCoord);
  gl_FragColor = vec4(video.xyz, vPosition.z - 0.1);
}
