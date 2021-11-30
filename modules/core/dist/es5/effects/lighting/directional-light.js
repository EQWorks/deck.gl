"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

class DirectionalLight extends _keplerOutdatedLuma.DirectionalLight {
  getProjectedLight() {
    return this;
  }

}

exports.default = DirectionalLight;
//# sourceMappingURL=directional-light.js.map