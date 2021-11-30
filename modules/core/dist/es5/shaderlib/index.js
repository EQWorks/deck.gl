"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "fp32", {
  enumerable: true,
  get: function () {
    return _keplerOutdatedLuma.fp32;
  }
});
Object.defineProperty(exports, "fp64", {
  enumerable: true,
  get: function () {
    return _keplerOutdatedLuma.fp64;
  }
});
Object.defineProperty(exports, "gouraudlighting", {
  enumerable: true,
  get: function () {
    return _keplerOutdatedLuma.gouraudlighting;
  }
});
exports.initializeShaderModules = initializeShaderModules;
Object.defineProperty(exports, "phonglighting", {
  enumerable: true,
  get: function () {
    return _keplerOutdatedLuma.phonglighting;
  }
});
Object.defineProperty(exports, "picking", {
  enumerable: true,
  get: function () {
    return _keplerOutdatedLuma.picking;
  }
});
Object.defineProperty(exports, "project", {
  enumerable: true,
  get: function () {
    return _project.default;
  }
});
Object.defineProperty(exports, "project64", {
  enumerable: true,
  get: function () {
    return _project3.default;
  }
});

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _project = _interopRequireDefault(require("../shaderlib/project/project"));

var _project2 = _interopRequireDefault(require("../shaderlib/project32/project32"));

var _project3 = _interopRequireDefault(require("../shaderlib/project64/project64"));

function initializeShaderModules() {
  (0, _keplerOutdatedLuma.registerShaderModules)([_keplerOutdatedLuma.fp32, _keplerOutdatedLuma.fp64, _project.default, _project2.default, _project3.default, _keplerOutdatedLuma.gouraudlighting, _keplerOutdatedLuma.phonglighting, _keplerOutdatedLuma.picking]);
  (0, _keplerOutdatedLuma.setDefaultShaderModules)([_project.default]);
}
//# sourceMappingURL=index.js.map