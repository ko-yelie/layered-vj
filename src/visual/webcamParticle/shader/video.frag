precision mediump float;
uniform vec2      resolution;
uniform vec2      videoResolution;
uniform sampler2D videoTexture;
uniform float     zoom;
uniform vec2      zoomPos;
uniform float     focusCount;
uniform vec4      focusPos1;
uniform vec4      focusPos2;
uniform vec4      focusPos3;
uniform vec4      focusPos4;

#pragma glslify: adjustRatio = require(./modules/ratio.glsl)

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  coord.y = 1. - coord.y;

  float zoomScale = 1. / zoom;
  vec2 defaultCoord = coord * zoomScale + (1. - zoomScale) / 2. + zoomPos * zoomScale;

  float count = max(focusCount, 1.);
  float width = 1. / count;
  vec4 pos = (count >= 4. && coord.x > width * 3.) ? focusPos4
    : (count >= 3. && coord.x > width * 2.) ? focusPos3
    : (count >= 2. && coord.x > width * 1.) ? focusPos2
    : focusPos1;
  vec2 center = vec2(mix(pos.y, pos.w, 0.5), pos.x);
  float scale = (width + (1. - width) / 5.) / zoom;
  float focusWidth = width * scale;
  float focusHalfWidth = focusWidth / 2.;
  float x = center.x;
  x = mix(focusHalfWidth, x, step(0., x - focusHalfWidth));
  x = mix(1. - focusHalfWidth, x, step(x + focusHalfWidth, 1.));
  float height = focusWidth * count;
  float y = min(center.y, 1. - height);
  vec2 focusCoord = vec2(
    mix(x - focusHalfWidth, x + focusHalfWidth, mod(coord.x, width) * count),
    mix(y, y + height, coord.y)
  );

  vec2 uv = adjustRatio(mix(focusCoord, defaultCoord, step(focusCount, 0.)), videoResolution, resolution);

  vec4 videoColor = texture2D(videoTexture, uv);
  videoColor = vec4(videoColor.rgb * 1.8, videoColor.a);

  gl_FragColor = mix(
    videoColor,
    vec4(0.),
    (vec4(1.) - step(uv.x, 1.)) + (vec4(1.) - step(0., uv.x))
  );
}
