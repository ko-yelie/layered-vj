precision mediump float;
uniform sampler2D prevVelocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform float     animation;
uniform float     isAccel;
uniform float     isRotation;

const float normalSpeed = -0.0004;
const float warpSpeed = 0.018;
const float accelWarpSpeed = 0.05;
const float rotationSpeed = -0.08;

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevVelocity = texture2D(prevVelocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);

  float radian = mix(0., prevVelocity.x + rotationSpeed, animation) * isRotation;
  vec2 velocityXY = vec2(mix(radian, 0., picture.w));

  float speed = mix(prevVelocity.z + normalSpeed, prevVelocity.z * 0.2 + warpSpeed + (accelWarpSpeed - warpSpeed) * isAccel, animation);
  float velocityZ = mix(speed, 0., picture.w);

  gl_FragColor = vec4(velocityXY, velocityZ, 0.);
}
