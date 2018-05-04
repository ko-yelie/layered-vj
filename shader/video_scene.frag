precision mediump float;
uniform vec2      resolution;
uniform vec2      videoResolution;
uniform sampler2D videoTexture;
uniform float     zoom;
uniform float     focusCount;
uniform vec4      focusPos1;
void main(){
  vec2 coord = gl_FragCoord.st / resolution / zoom + (1. - 1. / zoom) / 2.;
  coord.y = 1. - coord.y;

  vec2 copyCoord = coord;
  float rateX = videoResolution.x / (resolution.x * videoResolution.y / resolution.y);
  copyCoord.x /= rateX;
  copyCoord.x += (rateX - 1.) / 2.;
  float rateY = videoResolution.y / (resolution.y * videoResolution.x / resolution.x);
  copyCoord.y /= rateY;
  copyCoord.y += (rateY - 1.) / 2.;
  float ratio = step(0., (resolution.x / resolution.y) - (videoResolution.x / videoResolution.y));
  vec2 resultCoord = vec2(mix(copyCoord.x, coord.x, ratio), mix(coord.y, copyCoord.y, ratio));

  vec2 focusCoord1 = vec2(mix(focusPos1.y, focusPos1.w, resultCoord.x), mix(focusPos1.x, focusPos1.z, resultCoord.y));
  gl_FragColor = mix(texture2D(videoTexture, focusCoord1), vec4(0.), (vec4(1.) - step(focusCoord1.x, 1.)) + (vec4(1.) - step(0., focusCoord1.x)));
}
