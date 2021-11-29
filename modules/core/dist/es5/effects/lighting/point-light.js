"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _projectFunctions = require("../../shaderlib/project/project-functions");

var _lib = require("../../lib");

class PointLight extends _core.PointLight {
  constructor(props) {
    super(props);
    this.projectedLight = new _core.PointLight(props);
  }

  getProjectedLight(_ref) {
    let {
      layer
    } = _ref;
    const viewport = layer.context.viewport;
    const {
      coordinateSystem,
      coordinateOrigin
    } = layer.props;
    const position = (0, _projectFunctions.projectPosition)(this.position, {
      viewport,
      coordinateSystem,
      coordinateOrigin,
      fromCoordinateSystem: viewport.isGeospatial ? _lib.COORDINATE_SYSTEM.LNGLAT : _lib.COORDINATE_SYSTEM.IDENTITY,
      fromCoordinateOrigin: [0, 0, 0]
    });
    this.projectedLight.color = this.color;
    this.projectedLight.intensity = this.intensity;
    this.projectedLight.position = position;
    return this.projectedLight;
  }

}

exports.default = PointLight;
//# sourceMappingURL=point-light.js.map