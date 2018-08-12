attribute vec4 data;
attribute vec4 torus;
attribute vec3 torusNormal;
attribute vec4 male;
attribute vec3 maleNormal;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec4 ambientColor;
uniform vec4 modelColor;
uniform float modelRadian;
uniform float pointSize;
uniform sampler2D positionTexture;
// uniform sampler2D logoTexture;
// uniform sampler2D logo2Texture;
// uniform sampler2D faceTexture;
uniform float time;
uniform float volume;
uniform float isAudio;
uniform float pointShape;
uniform float prevDeformation;
uniform float nextDeformation;
uniform float deformationProgress;
uniform float loopCount;
varying vec2 vTexCoord;
varying vec4 vPosition;
varying vec4 vModelColor;

#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
#pragma glslify: hsv = require(../modules/color.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.0;

const float speed = 0.3;
const float amplitude = 1.;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 0.5;
const float maxDeformationDistance = 2.;
const float deformationMaxSize = 1. / maxDeformationDistance;
const float colorInterval = PI2 * 6.;

void main(){
  vec2 texCoord = data.xy;

  float deformationValue = 1. - abs(deformationProgress - 0.5) * 2.;
  float deformationDistance = mix(1., maxDeformationDistance, deformationValue);
  float deformationSize = mix(1., deformationMaxSize, deformationValue);

  vec4 position = texture2D(positionTexture, texCoord);
  position.z *= ((isAudio == 1.) ? volume : 1.);
  vec4 videoPosition = vec4(position.xyz, 1.);
  float videoSize = min(position.z, 10.) * pointSize * deformationSize;
  videoSize *= (pointShape == 2.) ? 4. :
    (pointShape == 1.) ? 1.3 :
    1.;

  float randomValue = (data.w + random(texCoord + mod(loopCount, 10.))) / 2.;
  float radian = loopCount * speed * randomValue;
  float radius = standardRadius + sin(time * 10.) * 0.1 + randomValue * amplitude - halfAmplitude;
  vec4 circlePosition = vec4(cos(radian) * radius, sin(radian) * radius, data.z * 0.1, 1.);

  vec3 axis = normalize(vec3(0., 1., 0.));

  // torus
  vec4 torusPosition = vec4(torus.xyz + (snoise3(torus.xyz + time) - 0.5) * 0.01, 1.);
  torusPosition.xyz = rotateQ(axis, modelRadian) * torusPosition.xyz;

  // male
  vec4 malePosition = vec4(male.xyz + (snoise3(male.xyz + time) - 0.5) * 0.01, 1.);
  malePosition.xyz = rotateQ(axis, modelRadian) * malePosition.xyz;

  // lighting
  float colorNTime = mod(time, colorInterval) / colorInterval;
  vec4 cModelColor = vec4(hsv(colorNTime * PI2, 0.25 + 0.7 * colorNTime, 0.85 + 0.1 * colorNTime), 1.);
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  float diffuse = clamp(dot(torusNormal, invLight), 0.1, 1.);
  vModelColor = cModelColor;
  vModelColor *= vec4(vec3(diffuse), 1.);
  vModelColor += ambientColor;

  // vec2 imageTexCoord = vec2(texCoord.x, 1. - texCoord.y);
  // vec4 logoPosition = vec4(texCoord * 2. - 1., 0., texture2D(logoTexture, imageTexCoord).a);
  // vec4 logo2Position = vec4(texCoord * 2. - 1., 0., texture2D(logo2Texture, imageTexCoord).a);
  // vec4 facePosition = vec4(texCoord * 2. - 1., 0., texture2D(faceTexture, imageTexCoord).a);

  vTexCoord = texCoord;
  vPosition = position;

  vec4 resultPosition = mix(
    // (prevDeformation == 4.) ? logo2Position :
    // (prevDeformation == 3.) ? facePosition :
    // (prevDeformation == 2.) ? logoPosition :
    (prevDeformation == 3.) ? malePosition :
    (prevDeformation == 2.) ? torusPosition :
    (prevDeformation == 1.) ? circlePosition :
    videoPosition,

    // (nextDeformation == 4.) ? logo2Position :
    // (nextDeformation == 3.) ? facePosition :
    // (nextDeformation == 2.) ? logoPosition :
    (nextDeformation == 3.) ? malePosition :
    (nextDeformation == 2.) ? torusPosition :
    (nextDeformation == 1.) ? circlePosition :
    videoPosition,

    deformationProgress);
  resultPosition.xyz *= deformationDistance;
  gl_Position = mvpMatrix * resultPosition;

  gl_PointSize = mix(
    (prevDeformation == 0.) ? videoSize : pointSize,
    (nextDeformation == 0.) ? videoSize : pointSize,
    deformationProgress);
}
