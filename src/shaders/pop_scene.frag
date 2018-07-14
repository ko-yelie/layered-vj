precision highp float;

uniform sampler2D videoTexture;
uniform float     bgColor;
uniform float     time;
varying vec2 vTexCoord;
varying vec4 vPosition;
varying float vRnd;

const float amplitude = 0.1;
const float amplitude2 = amplitude * 2.;

float circle(vec2 st) {
  return 1. - step(1. - amplitude2, length(st));
}

void main(){
  float rnd = vRnd;
  float randomTime = time * mix(0.5, 1., rnd);

  vec4 video = texture2D(videoTexture, vTexCoord);

  vec2 pointCoord = gl_PointCoord.st * 2. - 1.;
  float distortion = (sin(randomTime * 35.) * sin(pointCoord.y + sin(randomTime * 15.)) * 2. - 1.) * 0.05;
  pointCoord.x += distortion;
  float particleColor = 1. - step(length(vec2(
    circle(pointCoord - vec2(0., distortion) * amplitude),
    circle(pointCoord + vec2(-distortion, distortion) * amplitude)
  )), 0.);

  float minCurrentColor = mix(0.2, 0.4, bgColor);
  float maxCurrentColor = mix(0.9, 0.95, bgColor);
  vec4 currentColor = mix(vec4(minCurrentColor), vec4(maxCurrentColor), video);

  gl_FragColor = vec4(currentColor.rgb, 0.75 * particleColor);
}
