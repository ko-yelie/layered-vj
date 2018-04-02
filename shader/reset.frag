/* ----------------------------------------------------------------------------
 * reset shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec2  resolution;
uniform sampler2D videoTexture;
const   float PI  = 3.1415926;
const   float PI2 = PI * 2.0;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec2 p = (coord * 2. - 1.) * resolution / 100.;
    gl_FragColor = vec4(p, 0., 1.);
}
