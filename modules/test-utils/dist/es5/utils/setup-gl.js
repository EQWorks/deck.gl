"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _global = typeof global !== 'undefined' ? global : window;

(0, _core.setContextDefaults)({
  width: 1,
  height: 1,
  debug: true
});
_global.glContext = _global.glContext || (0, _core.createGLContext)();
var _default = _global.glContext;
exports.default = _default;
//# sourceMappingURL=setup-gl.js.map