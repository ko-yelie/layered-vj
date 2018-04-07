/* ----------------------------------------------------------------------------
 * scene shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D videoTexture;
varying vec2 vTexCoord;
varying vec4 vPosition;
void main(){
  vec4 video = texture2D(videoTexture, vTexCoord);
  gl_FragColor = vec4(mix(vec3(0.1), vec3(0.9), video.rgb), vPosition.z);
}
