precision mediump float;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D pictureTexture;
uniform vec2      resolution;
void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec2 pos = coord * 2. - 1.;
  vec4 prevPosition = texture2D(prevPositionTexture, coord);
  vec4 velocity = texture2D(velocityTexture, coord);
  vec4 picture = texture2D(pictureTexture, coord);
  float color = length(picture.rgb);
  float startY = pos.y;
  float y = mix(prevPosition.y + velocity.y, startY, picture.w);
  gl_FragColor = vec4(prevPosition.x, y, prevPosition.z, 1.);
}
