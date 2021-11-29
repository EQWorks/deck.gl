"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#define SHADER_NAME gpu-aggregation-to-grid-vs\n\nattribute vec2 positions;\nattribute vec3 weights;\nuniform vec2 windowSize;\nuniform vec2 cellSize;\nuniform vec2 gridSize;\nuniform mat4 uProjectionMatrix;\nuniform bool projectPoints;\n\nvarying vec3 vWeights;\n\nvec2 project_to_pixel(vec4 pos) {\n  vec4 result =  uProjectionMatrix * pos;\n  return result.xy/result.w;\n}\n\nvoid main(void) {\n\n  vWeights = weights;\n\n  vec4 windowPos = vec4(positions, 0, 1.);\n  if (projectPoints) {\n    windowPos = project_position_to_clipspace(vec3(positions, 0), vec2(0, 0), vec3(0, 0, 0));\n  }\n\n  vec2 pos = project_to_pixel(windowPos);\n  pos = floor(pos / cellSize);\n  pos = (pos * (2., 2.) / (gridSize)) - (1., 1.);\n  vec2 offset = 1.0 / gridSize;\n  pos = pos + offset;\n\n  gl_Position = vec4(pos, 0.0, 1.0);\n}\n";
exports.default = _default;
//# sourceMappingURL=aggregate-to-grid-vs.glsl.js.map