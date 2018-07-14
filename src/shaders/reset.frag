precision mediump float;
uniform vec2 resolution;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec2 p = coord * 2. - 1.;
  gl_FragColor = vec4(p, 1., 1.);
}
