/* ----------------------------------------------------------------------------
 * position update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec2      resolution;
uniform sampler2D videoTexture;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    coord.y = 1. - coord.y;
    gl_FragColor = texture2D(videoTexture, coord);
}
