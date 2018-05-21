attribute vec4 data;
uniform mat4 mvpMatrix;
uniform float pointSize;
uniform sampler2D positionTexture;
uniform sampler2D capturedPositionTexture;
uniform float volume;
uniform float isStop;
uniform float isAudio;
uniform float pointShape;
uniform float deformationProgress;
uniform float loopCount;
varying vec2 vTexCoord;
varying vec4 vPosition;

#pragma glslify: random = require(glsl-random)

const float speed = 0.3;
const float amplitude = 0.1;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 1.1;
const float maxDeformationDistance = 5.;
const float deformationSize = 1. / maxDeformationDistance;

void main(){
  vec2 texCoord = data.xy;

  float deformationDistance = mix(1., maxDeformationDistance, deformationProgress);
  vec4 position = mix(texture2D(positionTexture, texCoord), texture2D(capturedPositionTexture, texCoord), isStop);
  position.xy *= pow(deformationDistance, 1.5);
  position.z *= mix(1., volume, isAudio) * deformationDistance;
  vec3 videoPosition = vec3(position.xyz);

  float randomValue = (data.z + random(texCoord + mod(loopCount, 10.))) / 2.;
  float radian = loopCount * speed * randomValue;
  float radius = standardRadius + randomValue * amplitude - halfAmplitude;
  vec3 circlePosition = vec3(cos(radian) * radius, sin(radian) * radius, 0.);

  vTexCoord = texCoord;
  vPosition = position;
  gl_Position = mvpMatrix * vec4(mix(videoPosition, circlePosition, deformationProgress), 1.);
  gl_PointSize = position.z * pointSize * mix(mix(1., 1.3, pointShape), 4., step(2., pointShape)) * mix(1., deformationSize, deformationProgress);
}
