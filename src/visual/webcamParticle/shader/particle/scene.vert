attribute vec4 data;
uniform mat4 mvpMatrix;
uniform float pointSize;
uniform sampler2D positionTexture;
uniform sampler2D logoTexture;
uniform sampler2D logo2Texture;
uniform sampler2D faceTexture;
uniform float volume;
uniform float isAudio;
uniform float pointShape;
uniform float prevDeformation;
uniform float nextDeformation;
uniform float deformationProgress;
uniform float loopCount;
varying vec2 vTexCoord;
varying vec4 vPosition;

#pragma glslify: random = require(glsl-random)

const float speed = 0.3;
const float amplitude = 0.1;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 1.1;
const float maxDeformationDistance = 2.;
const float deformationMaxSize = 1. / maxDeformationDistance;

void main(){
  vec2 texCoord = data.xy;

  float deformationValue = 1. - abs(deformationProgress - 0.5) * 2.;
  float deformationDistance = mix(1., maxDeformationDistance, deformationValue);
  float deformationSize = mix(1., deformationMaxSize, deformationValue);
  vec4 position = texture2D(positionTexture, texCoord);
  position.xy *= pow(deformationDistance, 1.5);
  position.z *= ((isAudio == 1.) ? volume : 1.) * deformationDistance;
  vec4 videoPosition = vec4(position.xyz, 1.);
  float videoSize = min(position.z, 10.) * pointSize * deformationSize;
  videoSize *= (pointShape == 2.) ? 4. :
    (pointShape == 1.) ? 1.3 :
    1.;

  float randomValue = (data.w + random(texCoord + mod(loopCount, 10.))) / 2.;
  float radian = loopCount * speed * randomValue;
  float radius = standardRadius + randomValue * amplitude - halfAmplitude;
  vec4 circlePosition = vec4(cos(radian) * radius, sin(radian) * radius, data.z * 0.1, 1.);

  vec2 imageTexCoord = vec2(texCoord.x, 1. - texCoord.y);
  vec4 logoPosition = vec4(texCoord * 2. - 1., 0., texture2D(logoTexture, imageTexCoord).a);
  vec4 logo2Position = vec4(texCoord * 2. - 1., 0., texture2D(logo2Texture, imageTexCoord).a);
  vec4 facePosition = vec4(texCoord * 2. - 1., 0., texture2D(faceTexture, imageTexCoord).a);

  vTexCoord = texCoord;
  vPosition = position;
  gl_Position = mvpMatrix * mix(
    (prevDeformation == 4.) ? logo2Position :
    (prevDeformation == 3.) ? facePosition :
    (prevDeformation == 2.) ? logoPosition :
    (prevDeformation == 1.) ? circlePosition :
    videoPosition,
    (nextDeformation == 4.) ? logo2Position :
    (nextDeformation == 3.) ? facePosition :
    (nextDeformation == 2.) ? logoPosition :
    (nextDeformation == 1.) ? circlePosition :
    videoPosition,
    deformationProgress);
  gl_PointSize = mix(
    (prevDeformation == 0.) ? videoSize : pointSize,
    (nextDeformation == 0.) ? videoSize : pointSize,
    deformationProgress);
}
