precision mediump float;
uniform vec2 resolution;
uniform float z;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec2 p = coord * 2. - 1.;
  gl_FragColor = vec4(p, z, 1.);
}
