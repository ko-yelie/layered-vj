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
const float limitMinZ = -2.;
const float limitMaxZ = 10.;
const float limitMinXY = -10.;
const float limitMaxXY = 10.;

void main(){
  // vec2 coord = gl_FragCoord.st / resolution;
  // vec4 prevPosition = texture2D(prevPositionTexture, coord);
  // vec4 velocity = texture2D(velocityTexture, coord);
  // vec4 picture = texture2D(pictureTexture, coord);

  // float color = length(picture.rgb);
  // float startZ = color * (maxZ - minZ) + minZ;
  // float z = mix(prevPosition.z + velocity.z, startZ, picture.w);
  // z = clamp(z, limitMinZ, limitMaxZ);

  // vec2 startXY = coord * 2. - 1.;
  // float radian = atan(startXY.y, startXY.x) + velocity.x;
  // float radius = length(mix(startXY, prevPosition.xy, animation)) + z * 0.01;
  // vec2 xy = mix(vec2(cos(radian) * radius, sin(radian) * radius), startXY, picture.w);
  // xy = clamp(xy, limitMinXY, limitMaxXY);

  // gl_FragColor = vec4(xy, z, mix(prevPosition.w, startZ, picture.w));

  vec2 uv = gl_FragCoord.st / resolution;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec4 velocity = texture2D(velocityTexture, uv);

  vec3 position;
  if (velocity.w == 1.) {
    vec2 nPosition = uv * 2. - 1.;
    position = vec3(nPosition, 1.);
  } else {
    position = prevPosition.xyz + velocity.xyz;
    position.xy = clamp(position.xy, limitMinXY, limitMaxXY);
    position.z = clamp(position.z, limitMinZ, limitMaxZ);
  }

  gl_FragColor = vec4(position, prevPosition.w);
}
