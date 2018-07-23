attribute vec4 data;
uniform mat4 mvpMatrix;
uniform vec2 resolution;
uniform float pointSize;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float volume;
uniform float isAudio;
uniform float time;
varying vec2 vTexCoord;
varying vec4 vPosition;
varying float vRnd;

const float yDiff = -0.3;
const float xAmplitude = 0.4;
const float zAmplitude = 2.;
const float scaleSpeed = 0.8;
const float limitMin = -5.;
const float limitMax = 5.;

void main(){
  vec2 texCoord = data.xy;
  float rnd = data.w;
  float symmetryRnd = rnd * 2. - 1.;

  vec4 position = texture2D(positionTexture, texCoord);
  position.x += symmetryRnd * sin(time * rnd * 4.) * xAmplitude;
  position.y += yDiff + rnd * 0.1;
  position.z += rnd * zAmplitude;
  position.w = zAmplitude;
  vec3 videoPosition = vec3(clamp(position.xyz, limitMin, limitMax));

  vec4 velocity = texture2D(velocityTexture, texCoord);

  vTexCoord = texCoord;
  vPosition = position;
  vRnd = rnd;
  gl_Position = mvpMatrix * vec4(videoPosition, 1.);
  gl_PointSize = pow(velocity.y * resolution.y * (isAudio == 1. ? volume * 1.5 : 1.), 2.) * scaleSpeed * pointSize;
}
