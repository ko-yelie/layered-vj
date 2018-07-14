attribute vec4 data;
uniform mat4 mvpMatrix;
uniform vec2 resolution;
uniform float pointSize;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float volume;
uniform float isAudio;
uniform float deformationProgress;
uniform float time;
varying vec2 vTexCoord;
varying vec4 vPosition;
varying float vRnd;

#pragma glslify: random = require(glsl-random)

const float yDiff = -0.3;
const float xAmplitude = 0.4;
const float zAmplitude = 2.;
const float speed = 0.3;
const float amplitude = 0.1;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 1.1;
const float maxDeformationDistance = 5.;
const float deformationSize = 1. / maxDeformationDistance;
const float scaleSpeed = 0.8;

void main(){
  vec2 texCoord = data.xy;
  float rnd = data.w;
  float symmetryRnd = rnd * 2. - 1.;

  float deformationDistance = mix(1., maxDeformationDistance, deformationProgress);
  vec4 position = texture2D(positionTexture, texCoord);
  position.x += symmetryRnd * sin(time * rnd * 4.) * xAmplitude;
  position.y += yDiff + rnd * 0.1;
  position.xy *= pow(deformationDistance, 1.5);
  position.z += rnd * zAmplitude;
  position.z *= deformationDistance;
  position.w = zAmplitude;
  vec3 videoPosition = vec3(position.xyz);

  vec4 velocity = texture2D(velocityTexture, texCoord);

  float randomValue = (data.z + random(texCoord + mod(time, 10.))) / 2.;
  float radian = time * speed * randomValue;
  float radius = standardRadius + randomValue * amplitude - halfAmplitude;
  vec3 circlePosition = vec3(cos(radian) * radius, sin(radian) * radius, 0.);

  vTexCoord = texCoord;
  vPosition = position;
  vRnd = rnd;
  gl_Position = mvpMatrix * vec4(mix(videoPosition, circlePosition, deformationProgress), 1.);
  gl_PointSize = pow(velocity.y * resolution.y * mix(1., volume * 1.5, isAudio), 2.) * scaleSpeed * pointSize;
}
