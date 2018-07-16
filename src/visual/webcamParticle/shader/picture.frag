precision mediump float;
uniform sampler2D videoTexture;
uniform sampler2D prevVideoTexture;
uniform sampler2D prevPictureTexture;
uniform vec2      resolution;
const float threshold = 0.1;
const float fadeoutSpeed = 0.04;
const float attenuationRate = 1. - fadeoutSpeed;

float getDiff(vec2 coord) {
  vec4 video = texture2D(videoTexture, coord);
  vec4 prevVideo = texture2D(prevVideoTexture, coord);
  return abs(length(video.rgb) - length(prevVideo.rgb)) / 1.732;
}

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 video = texture2D(videoTexture, coord);
  vec4 prevVideo = texture2D(prevVideoTexture, coord);
  vec4 prevPicture = texture2D(prevPictureTexture, coord);

  float diff = getDiff(coord);

  float aroundDiff = 0.;

  aroundDiff += getDiff(coord + vec2(-1., 0.));
  aroundDiff += getDiff(coord + vec2(0., 1.));
  aroundDiff += getDiff(coord + vec2(1., 0.));
  aroundDiff += getDiff(coord + vec2(0., -1.));

  aroundDiff += getDiff(coord + vec2(-2., 0.));
  aroundDiff += getDiff(coord + vec2(-1., 1.));
  aroundDiff += getDiff(coord + vec2(0., 2.));
  aroundDiff += getDiff(coord + vec2(1., 1.));
  aroundDiff += getDiff(coord + vec2(2., 0.));
  aroundDiff += getDiff(coord + vec2(1., -1.));
  aroundDiff += getDiff(coord + vec2(0., -2.));
  aroundDiff += getDiff(coord + vec2(-1., -1.));

  aroundDiff /= 12.;

  vec3 prevColor = prevPicture.rgb * attenuationRate;
  float isMove = step(threshold, (diff + aroundDiff));
  gl_FragColor = vec4(mix(prevColor, video.rgb, isMove), isMove);
}
