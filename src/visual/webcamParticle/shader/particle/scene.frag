precision highp float;
uniform sampler2D videoTexture;
uniform sampler2D logoTexture;
uniform sampler2D logo2Texture;
uniform sampler2D faceTexture;
uniform float     bgColor;
uniform float     mode;
uniform float     pointShape;
uniform float     animation;
uniform float prevDeformation;
uniform float nextDeformation;
uniform float deformationProgress;
varying vec2 vTexCoord;
varying vec4 vPosition;

float lengthN(vec2 v, float n) {
  vec2 tmp = pow(abs(v), vec2(n));
  return pow(tmp.x + tmp.y, 1. / n);
}

void main(){
  vec4 video = texture2D(videoTexture, vTexCoord);
  float rate = max(vPosition.z / vPosition.w, 0.);

  vec2 pointCoord = gl_PointCoord.st * 2. - 1.;
  float circle = smoothstep(0.9, 1., length(pointCoord));
  float star = smoothstep(0.9, 1., lengthN(pointCoord, 0.5));
  float shape = 1. - (
    (pointShape == 2.) ? star :
    (pointShape == 1.) ? circle :
    0.);
  vec4 shapeColor = vec4(vec3(1.), (mode == 0.) ? shape : 1.);
  vec4 thumbColor = texture2D(videoTexture, vec2(gl_PointCoord.s, 1. - gl_PointCoord.t));
  vec4 particleColor = (pointShape == 3.) ? thumbColor : shapeColor;

  float minCurrentColor = (bgColor == 1.) ? 0.4 : (animation == 1.) ? 0.3 : 0.2;
  float maxCurrentColor = (bgColor == 1.) ? 0.95 : 0.95;
  vec4 currentColor = mix(vec4(minCurrentColor), vec4(maxCurrentColor), video);
  vec4 videoColor = vec4(currentColor.rgb, sqrt(rate)) * particleColor;

  vec2 imageTexCoord = vec2(vTexCoord.x, 1. - vTexCoord.y);
  vec4 logoColor = texture2D(logoTexture, imageTexCoord);
  vec4 logo2Color = texture2D(logo2Texture, imageTexCoord);
  vec4 faceColor = texture2D(faceTexture, imageTexCoord);

  gl_FragColor = mix(
    (prevDeformation == 4.) ? logo2Color :
    (prevDeformation == 3.) ? faceColor :
    (prevDeformation == 2.) ? logoColor :
    videoColor,
    (nextDeformation == 4.) ? logo2Color :
    (nextDeformation == 3.) ? faceColor :
    (nextDeformation == 2.) ? logoColor :
    videoColor,
    deformationProgress);
}
