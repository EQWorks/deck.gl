"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _suncalc = require("./suncalc");

class SunLight extends _core.DirectionalLight {
  constructor(_ref) {
    let {
      timestamp,
      ...others
    } = _ref;
    super(others);
    this.timestamp = timestamp;
  }

  getProjectedLight(_ref2) {
    let {
      layer
    } = _ref2;
    const {
      latitude,
      longitude
    } = layer.context.viewport;
    this.direction = (0, _suncalc.getSunlightDirection)(this.timestamp, latitude, longitude);
    return this;
  }

}

exports.default = SunLight;
//# sourceMappingURL=sun-light.js.map