"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#define SHADER_NAME reflection-effect-fs\n\nprecision highp float;\n\nuniform sampler2D reflectionTexture;\nuniform int reflectionTextureWidth;\nuniform int reflectionTextureHeight;\n\nuniform float reflectivity;\nuniform float blur;\n\n\nvarying vec2 uv;\n\n#define KERNEL_SIZE 7\nvec4 sample_gaussian(sampler2D tex, vec2 dim, vec2 uv, float sigma) {\n  if (sigma == 0.0) {\n    return texture2D(tex, uv);\n  }\n\n  vec2 delta = 1.0 / dim;\n  vec2 top_left = uv - delta * float(KERNEL_SIZE+1) / 2.0;\n\n  vec4 color = vec4(0);\n  float sum = 0.0;\n  for (int i = 0; i <  KERNEL_SIZE; ++i) {\n    for (int j = 0; j < KERNEL_SIZE; ++j) {\n      vec2 uv2 = top_left + vec2(i, j) * delta;\n      float d = length((uv2 - uv) * dim);\n      float f = exp(-(d*d) / (2.0*sigma * sigma));\n      color += f * texture2D(tex, uv2);\n      sum += f;\n    }\n  }\n  return color / sum;\n}\n\nvoid main(void) {\n  float alpha = 1000.0;\n  float sigma = blur / (alpha * (1.0 - blur));\n  sigma *= float(reflectionTextureWidth);\n\n\n  gl_FragColor = sample_gaussian(reflectionTexture, vec2(reflectionTextureWidth,\n    reflectionTextureHeight), vec2(uv.x, 1. - uv.y), sigma);\n  gl_FragColor *= reflectivity;\n}\n";
exports.default = _default;
//# sourceMappingURL=reflection-effect-fragment.glsl.js.map