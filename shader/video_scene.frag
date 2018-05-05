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
  vec2 coord = gl_FragCoord.st / resolution;
  coord.y = 1. - coord.y;

  float rateX = videoResolution.x / (resolution.x * videoResolution.y / resolution.y);
  float rateY = videoResolution.y / (resolution.y * videoResolution.x / resolution.x);
  float ratio = step(0., (resolution.x / resolution.y) - (videoResolution.x / videoResolution.y));
  vec2 convertedCoord = vec2(
    mix(convert(coord.x, rateX), coord.x, ratio),
    mix(coord.y, convert(coord.y, rateY), ratio)
  );

  float width = 1. / focusCount;
  float halfWidth = width / 2.;
  vec4 pos = (focusCount >= 4. && coord.x > width * 3.) ? focusPos4
    : (focusCount >= 3. && coord.x > width * 2.) ? focusPos3
    : (focusCount >= 2. && coord.x > width * 1.) ? focusPos2
    : focusPos1;
  vec2 center = vec2(mix(pos.y, pos.w, 0.5), pos.x);
  float scale = (width + (1. - width) / 5.) / zoom;
  vec2 focusCoord = vec2(
    mix(center.x - halfWidth * scale, center.x + halfWidth * scale, mod(convertedCoord.x, width) * focusCount),
    mix(center.y, center.y + width * scale * focusCount, convertedCoord.y)
  );

  gl_FragColor = mix(
    texture2D(videoTexture, focusCoord),
    vec4(0.),
    (vec4(1.) - step(focusCoord.x, 1.)) + (vec4(1.) - step(0., focusCoord.x))
  );
}
