precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
uniform float     animation;

const float PI   = 3.1415926;
const float PI2  = PI * 2.;
const float maxZ = 0.8;
const float minZ = 0.5;
const float limitMin = -5.;
const float limitMax = 5.;

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevPosition = texture2D(prevPositionTexture, coord);
  vec4 velocity = texture2D(velocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);

  float color = length(picture.rgb);
  float startZ = color * (maxZ - minZ) + minZ;
  float z = mix(prevPosition.z + velocity.z, startZ, picture.w);

  vec2 startXY = coord * 2. - 1.;
  float radian = atan(startXY.y, startXY.x) + velocity.x;
  float radius = length(mix(startXY, prevPosition.xy, animation)) + z * 0.01;
  vec2 xy = mix(vec2(cos(radian) * radius, sin(radian) * radius), startXY, picture.w);

  gl_FragColor = vec4(clamp(vec3(xy, z), limitMin, limitMax), mix(prevPosition.w, startZ, picture.w));
}
