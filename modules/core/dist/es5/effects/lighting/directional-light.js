"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

class DirectionalLight extends _core.DirectionalLight {
  getProjectedLight() {
    return this;
  }

}

exports.default = DirectionalLight;
//# sourceMappingURL=directional-light.js.map