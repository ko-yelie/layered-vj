/* ----------------------------------------------------------------------------
 * position update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform bool      move;
const   float     SPEED = 0.1;
const   float     minZ = 0.5;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 prevPosition = texture2D(prevPositionTexture, coord);
    vec4 picture = texture2D(pictureTexture, coord);
    float power = prevPosition.w * 0.95;
    if(move){
        power = 1.0;
    }
    vec3 position = prevPosition.xyz + picture.xyz * power * SPEED;
    float color = picture.x + picture.y + picture.z;
    float z = step(0.01, color) * minZ + color * 0.3;
    gl_FragColor = vec4(prevPosition.xy, z, prevPosition.w);
}
