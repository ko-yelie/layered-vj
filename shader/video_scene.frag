precision mediump float;
uniform vec2      resolution;
uniform vec2      videoResolution;
uniform sampler2D videoTexture;
uniform float     zoom;
uniform float     focusCount;
uniform vec4      focusPos1;
uniform vec4      focusPos2;
uniform vec4      focusPos3;
uniform vec4      focusPos4;

float convert(float coord, float rate) {
  return coord / rate + (rate - 1.) / 2.;
}

void main(){
  vec2 coord = gl_FragCoord.st / resolution / zoom + (1. - 1. / zoom) / 2.;
  coord.y = 1. - coord.y;

  float rateX = videoResolution.x / (resolution.x * videoResolution.y / resolution.y);
  float rateY = videoResolution.y / (resolution.y * videoResolution.x / resolution.x);
  float ratio = step(0., (resolution.x / resolution.y) - (videoResolution.x / videoResolution.y));
  vec2 resultCoord = vec2(mix(convert(coord.x, rateX), coord.x, ratio), mix(coord.y, convert(coord.y, rateY), ratio));

  vec2 resultFocusCoord;
  float width = 1. / focusCount;
  if (focusCount >= 4. && resultCoord.x > width * 3.) {
    resultFocusCoord = vec2(mix(focusPos4.y, focusPos4.w, resultCoord.x), mix(focusPos4.x, focusPos4.z, resultCoord.y));
  } else if (focusCount >= 3. && resultCoord.x > width * 2.) {
    resultFocusCoord = vec2(mix(focusPos3.y, focusPos3.w, resultCoord.x), mix(focusPos3.x, focusPos3.z, resultCoord.y));
  } else if (focusCount >= 2. && resultCoord.x > width) {
    resultFocusCoord = vec2(mix(focusPos2.y, focusPos2.w, resultCoord.x), mix(focusPos2.x, focusPos2.z, resultCoord.y));
  } else {
    resultFocusCoord = vec2(mix(focusPos1.y, focusPos1.w, resultCoord.x), mix(focusPos1.x, focusPos1.z, resultCoord.y));
  }

  gl_FragColor = mix(texture2D(videoTexture, resultFocusCoord), vec4(0.), (vec4(1.) - step(resultFocusCoord.x, 1.)) + (vec4(1.) - step(0., resultFocusCoord.x)));
}
