/* ----------------------------------------------------------------------------
 * reset shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec2  resolution;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec2 p = (coord * 2. - 1.) * resolution / 100.;
    gl_FragColor = vec4(p, 0., 1.);
}
