precision mediump float;
uniform sampler2D prevVelocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
const float speed = 0.00003;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevVelocity = texture2D(prevVelocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);
  float velocityY = mix(speed + prevVelocity.y, 0., picture.w);
  gl_FragColor = vec4(prevVelocity.x, velocityY, prevVelocity.z, 0.);
}
