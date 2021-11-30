"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#define SHADER_NAME reflection-effect-vs\n\nattribute vec3 vertices;\n\nvarying vec2 uv;\n\nvoid main(void) {\n  uv = vertices.xy;\n  gl_Position = vec4(2. * vertices.xy - vec2(1., 1.), 1., 1.);\n}\n";
exports.default = _default;
//# sourceMappingURL=reflection-effect-vertex.glsl.js.map