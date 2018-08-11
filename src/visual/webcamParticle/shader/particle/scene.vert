attribute vec4 data;
attribute vec4 torus;
attribute vec3 normal;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec4 ambientColor;
uniform vec4 modelColor;
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

  vec4 torusPosition = vec4(torus.xyz + (snoise3(torus.xyz + time) - 0.5) * 0.01, 1.);

  // lighting
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
  float diffuse = clamp(dot(normal, invLight), 0.1, 1.0);
  vModelColor = modelColor;
  vModelColor *= vec4(vec3(diffuse), 1.0);
  vModelColor += ambientColor;

  // vec2 imageTexCoord = vec2(texCoord.x, 1. - texCoord.y);
  // vec4 logoPosition = vec4(texCoord * 2. - 1., 0., texture2D(logoTexture, imageTexCoord).a);
  // vec4 logo2Position = vec4(texCoord * 2. - 1., 0., texture2D(logo2Texture, imageTexCoord).a);
  // vec4 facePosition = vec4(texCoord * 2. - 1., 0., texture2D(faceTexture, imageTexCoord).a);

  vTexCoord = texCoord;
  vPosition = position;

  gl_Position = mvpMatrix * mix(
    // (prevDeformation == 4.) ? logo2Position :
    // (prevDeformation == 3.) ? facePosition :
    // (prevDeformation == 2.) ? logoPosition :
    (prevDeformation == 2.) ? torusPosition :
    (prevDeformation == 1.) ? circlePosition :
    videoPosition,

    // (nextDeformation == 4.) ? logo2Position :
    // (nextDeformation == 3.) ? facePosition :
    // (nextDeformation == 2.) ? logoPosition :
    (nextDeformation == 2.) ? torusPosition :
    (nextDeformation == 1.) ? circlePosition :
    videoPosition,

    deformationProgress);

  gl_PointSize = mix(
    (prevDeformation == 0.) ? videoSize : pointSize,
    (nextDeformation == 0.) ? videoSize : pointSize,
    deformationProgress);
}
