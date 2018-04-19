precision mediump float;
uniform vec2      resolution;
uniform sampler2D videoTexture;
uniform float     zoom;
void main(){
  vec2 coord = gl_FragCoord.st / resolution / zoom + (1. - 1. / zoom) / 2.;
  coord.y = 1. - coord.y;
  gl_FragColor = texture2D(videoTexture, coord);
}
