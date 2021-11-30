"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

const _global = typeof global !== 'undefined' ? global : window;

(0, _keplerOutdatedLuma.setContextDefaults)({
  width: 1,
  height: 1,
  debug: true
});
_global.glContext = _global.glContext || (0, _keplerOutdatedLuma.createGLContext)();
var _default = _global.glContext;
exports.default = _default;
//# sourceMappingURL=setup-gl.js.map