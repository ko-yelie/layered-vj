/* ----------------------------------------------------------------------------
 * position update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
const   float     minZ = 0.2;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 prevPosition = texture2D(prevPositionTexture, coord);
    vec4 velocity = texture2D(velocityTexture, coord);
    vec4 picture = texture2D(pictureTexture, coord);
    float color = picture.x + picture.y + picture.z;
    float z = (step(0.01, color) * minZ + color * 0.3) * velocity.z;
    gl_FragColor = vec4(prevPosition.xy, z, prevPosition.w);
}
