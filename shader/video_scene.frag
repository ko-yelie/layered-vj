precision mediump float;
uniform vec2      resolution;
uniform sampler2D videoTexture;
uniform float     zoom;
uniform float     focusCount;
uniform vec4      focusPos1;
void main(){
  vec2 coord = gl_FragCoord.st / resolution / zoom + (1. - 1. / zoom) / 2.;
  coord.y = 1. - coord.y;
  vec2 focusCoord1 = vec2(mix(focusPos1.y, focusPos1.w, coord.x), mix(focusPos1.x, focusPos1.z, coord.y));
  gl_FragColor = mix(texture2D(videoTexture, focusCoord1), vec4(0.), (vec4(1.) - step(focusCoord1.x, 1.)) + (vec4(1.) - step(0., focusCoord1.x)));
}
