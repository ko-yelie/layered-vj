attribute vec4 data;
attribute vec4 sphere;
attribute vec3 sphereNormal;
attribute vec4 torus;
attribute vec3 torusNormal;
attribute vec4 male;
attribute vec3 maleNormal;
attribute vec4 text;
attribute vec3 textNormal;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec4 ambientColor;
uniform vec3 eyeDirection;
uniform vec4 modelColor;
uniform float modelRadian;
uniform float pointSize;
uniform vec2 resolution;
uniform vec2 videoResolution;
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
uniform float noiseType;
uniform float loopCount;
varying vec2 vTexCoord;
varying vec4 vPosition;
varying vec4 vModelColor;

#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
#pragma glslify: hsv = require(../modules/color.glsl)
#pragma glslify: adjustRatio = require(../modules/ratio.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.0;

const float speed = 0.3;
const float amplitude = 1.;
const float halfAmplitude = amplitude / 2.;
const float standardRadius = 0.5;
const float maxDeformationDistance = 2.;
const float deformationMaxSize = 1. / maxDeformationDistance;
const float colorInterval = PI2 * 6.;
const vec3 axis = normalize(vec3(0., 1., 0.));

vec2 adjustRatio2(vec2 coord, vec2 inputResolution, vec2 outputResolution) {
  vec2 ratio = vec2(
    min((outputResolution.x / outputResolution.y) / (inputResolution.x / inputResolution.y), 1.0),
    min((outputResolution.y / outputResolution.x) / (inputResolution.y / inputResolution.x), 1.0)
  );
  return coord * ratio;
}

vec4 modelPosition (vec4 model, vec3 normal) {
  float noiseValue =
    noiseType == 2. ? pow(snoise3(model.xyz + time * 0.5) * 2., 3.) * (sin(time * 2.) + 0.7) * 0.01 :
    noiseType == 1. ? pow(random(model.xy + time * 0.5) * 2., 3.) * (sin(time * 2.) + 0.7) * 0.01 :
    0.;
  vec4 modelPosition = vec4(model.xyz + normal * noiseValue, 1.);
  modelPosition.xyz = rotateQ(axis, modelRadian) * modelPosition.xyz;
  return modelPosition;
}

void main(){
  vec2 texCoord = data.xy;

  float deformationValue = 1. - abs(deformationProgress - 0.5) * 2.;
  float deformationDistance = mix(1., maxDeformationDistance, deformationValue);
  float deformationSize = mix(1., deformationMaxSize, deformationValue);

  vec4 position = texture2D(positionTexture, adjustRatio(texCoord, videoResolution, resolution));
  position.z *= ((isAudio == 1.) ? volume : 1.);
  vec4 videoPosition = vec4(position.xyz, 1.);
  float videoSize = min(position.z, 5.) * pointSize * deformationSize;
  videoSize *= (pointShape == 2.) ? 4. :
    (pointShape == 1.) ? 1.3 :
    1.;

  float randomValue = (data.w + random(texCoord + mod(loopCount, 10.))) / 2.;
  float radian = loopCount * speed * randomValue;
  float radius = standardRadius + sin(time * 10.) * 0.1 + randomValue * amplitude - halfAmplitude;
  vec4 circlePosition = vec4(cos(radian) * radius, sin(radian) * radius, data.z * 0.1, 1.);

  // sphere
  vec4 spherePosition = modelPosition(sphere, sphereNormal);

  // torus
  vec4 torusPosition = modelPosition(torus, torusNormal);

  // male
  vec4 malePosition = modelPosition(male, maleNormal);

  // text
  vec4 textPosition = modelPosition(text, textNormal);

  // vec2 imageTexCoord = vec2(texCoord.x, 1. - texCoord.y);
  // vec4 logoPosition = vec4(texCoord * 2. - 1., 0., texture2D(logoTexture, imageTexCoord).a);
  // vec4 logo2Position = vec4(texCoord * 2. - 1., 0., texture2D(logo2Texture, imageTexCoord).a);
  // vec4 facePosition = vec4(texCoord * 2. - 1., 0., texture2D(faceTexture, imageTexCoord).a);

  vTexCoord = texCoord;
  vPosition = position;

  // lighting
  vec3 circleNormal = torusNormal;
  vec3 resultNormal = mix(
    (prevDeformation == 4.) ? textNormal :
    (prevDeformation == 3.) ? maleNormal :
    (prevDeformation == 2.) ? torusNormal :
    (prevDeformation == 5.) ? sphereNormal :
    circleNormal,

    (nextDeformation == 4.) ? textNormal :
    (nextDeformation == 3.) ? maleNormal :
    (nextDeformation == 2.) ? torusNormal :
    (nextDeformation == 5.) ? sphereNormal :
    circleNormal,

    deformationProgress);
  resultNormal = rotateQ(axis, modelRadian) * resultNormal;
  float colorNTime = mod(time, colorInterval) / colorInterval;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).xyz;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(resultNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(resultNormal, halfLE), 0., 1.), 50.);
  vModelColor = vec4(hsv(colorNTime * PI2, 0.25 + 0.7 * colorNTime, 0.85 + 0.1 * colorNTime), 1.);
  vModelColor *= vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
  vModelColor += ambientColor;

  vec4 resultPosition = mix(
    // (prevDeformation == 4.) ? logo2Position :
    // (prevDeformation == 3.) ? facePosition :
    // (prevDeformation == 2.) ? logoPosition :
    (prevDeformation == 4.) ? textPosition :
    (prevDeformation == 3.) ? malePosition :
    (prevDeformation == 2.) ? torusPosition :
    (prevDeformation == 5.) ? spherePosition :
    (prevDeformation == 1.) ? circlePosition :
    videoPosition,

    // (nextDeformation == 4.) ? logo2Position :
    // (nextDeformation == 3.) ? facePosition :
    // (nextDeformation == 2.) ? logoPosition :
    (nextDeformation == 4.) ? textPosition :
    (nextDeformation == 3.) ? malePosition :
    (nextDeformation == 2.) ? torusPosition :
    (nextDeformation == 5.) ? spherePosition :
    (nextDeformation == 1.) ? circlePosition :
    videoPosition,

    deformationProgress);
  resultPosition.xyz *= deformationDistance;
  resultPosition.xy = adjustRatio2(resultPosition.xy, resolution, vec2(1.));
  gl_Position = mvpMatrix * resultPosition;

  gl_PointSize = mix(
    (prevDeformation == 0.) ? videoSize : pointSize,
    (nextDeformation == 0.) ? videoSize : pointSize,
    deformationProgress);
}
