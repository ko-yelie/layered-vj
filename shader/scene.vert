attribute vec3 texCoord;
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

const float speed = 0.3;
const float amplitude = 0.1;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 1.1;

float getRandom(vec2 n){
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main(){
  float deformationDistance = mix(1., 5., deformationProgress);
  vec4 position = mix(texture2D(positionTexture, texCoord.st), texture2D(capturedPositionTexture, vTexCoord), isStop);
  position.xy *= pow(deformationDistance, 1.5);
  position.z *= mix(1., volume / 255. * 2., isAudio) * deformationDistance;
  vec3 videoPosition = vec3(position.xyz);

  float random = (texCoord.p + getRandom(texCoord.st + mod(loopCount, 10.))) / 2.;
  float radian = loopCount * speed * random;
  float radius = standardRadius + random * amplitude - halfAmplitude;
  vec3 circlePosition = vec3(cos(radian) * radius, sin(radian) * radius, 0.);

  vTexCoord = texCoord.st;
  vPosition = position;
  gl_Position = mvpMatrix * vec4(mix(videoPosition, circlePosition, deformationProgress), 1.);
  gl_PointSize = position.z * pointSize * mix(mix(1., 1.3, pointShape), 4., step(2., pointShape)) * mix(1., 0.2, deformationProgress);
}
