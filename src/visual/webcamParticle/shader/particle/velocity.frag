precision mediump float;
uniform sampler2D prevVelocityTexture;
uniform sampler2D prevPositionTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform float     animation;
uniform float     speed;
uniform float     density;
uniform float     ease;
uniform float     isAccel;
uniform float     isRotation;

#pragma glslify: curlNoise = require(glsl-curl-noise)

// const float normalSpeed = -0.0004;
const float warpSpeed = 0.012;
const float accelWarpSpeed = 0.05;
const float rotationSpeed = -0.08;

// const float speed = 0.02;
// const float density = 0.007;
// const float ease = 0.02;

void main(){
  // vec2 coord = gl_FragCoord.st / resolution;
  // vec4 prevVelocity = texture2D(prevVelocityTexture, coord);
  // vec4 picture = texture2D(pictureTexture, coord);

  // float radian = mix(0., prevVelocity.x + rotationSpeed, animation) * isRotation;
  // vec2 velocityXY = vec2(mix(radian, 0., picture.w));

  // float speed = mix(prevVelocity.z + normalSpeed, prevVelocity.z * 0.2 + warpSpeed + (accelWarpSpeed - warpSpeed) * isAccel, animation);
  // float velocityZ = mix(speed, 0., picture.w);

  // gl_FragColor = vec4(velocityXY, velocityZ, 0.);

  vec2 uv = gl_FragCoord.st / resolution;
  vec4 velocity = texture2D(prevVelocityTexture, uv);
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
  vec4 picture = texture2D(pictureTexture, uv);

  velocity.x += mix(0., rotationSpeed, animation) * isRotation;
  velocity.z += mix(0., warpSpeed + (accelWarpSpeed - warpSpeed) * isAccel, animation);

  velocity.xyz += curlNoise(prevPosition * density) * 0.001 * speed;
  velocity.xyz *= velocity.w;

  if (picture.w == 1.) {
    velocity.w = 1.;
  } else if (velocity.w < 0.05) {
    velocity.w = 0.;
  } else {
    velocity.w -= velocity.w * ease;
  }

  gl_FragColor = velocity;
}
