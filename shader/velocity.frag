/* ----------------------------------------------------------------------------
 * velocity update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D prevTexture;
uniform sampler2D positionTexture;
uniform vec2      resolution;
uniform float     time;
uniform vec2      mouse;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 prevVelocity = texture2D(prevTexture, coord);
    vec4 position = texture2D(positionTexture, coord);
    vec3 velocity = prevVelocity.xyz;
    prevVelocity.z -= pow(position.z, 2.) * 1.;
    gl_FragColor = vec4(normalize(velocity), 0.0);
}
