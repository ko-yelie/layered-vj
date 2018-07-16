precision mediump float;
uniform sampler2D texture;
varying vec2      vUv;

const float binalizationThreshold = 0.3;

void main(){
  vec4 video = texture2D(texture, vUv);

  float average = (video.r + video.g + video.b) / 3.;
  vec3 mono = vec3(average);
  vec3 binary = vec3(step(binalizationThreshold, average));

  gl_FragColor = vec4(binary, 1.);
}
