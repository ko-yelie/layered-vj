vec2 adjustRatio(vec2 coord, vec2 inputResolution, vec2 outputResolution) {
  vec2 ratio = vec2(
    min((outputResolution.x / outputResolution.y) / (inputResolution.x / inputResolution.y), 1.0),
    min((outputResolution.y / outputResolution.x) / (inputResolution.y / inputResolution.x), 1.0)
  );
  return vec2(
    coord.x * ratio.x + (1.0 - ratio.x) * 0.5,
    coord.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

#pragma glslify: export(adjustRatio)
