"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pointLight = _interopRequireDefault(require("./point-light"));

var _viewportUniforms = require("../../shaderlib/project/viewport-uniforms");

class CameraLight extends _pointLight.default {
  getProjectedLight(_ref) {
    let {
      layer
    } = _ref;
    const viewport = layer.context.viewport;
    const {
      coordinateSystem,
      coordinateOrigin,
      modelMatrix
    } = layer.props;
    const {
      project_uCameraPosition
    } = (0, _viewportUniforms.getUniformsFromViewport)({
      viewport,
      modelMatrix,
      coordinateSystem,
      coordinateOrigin
    });
    this.projectedLight.color = this.color;
    this.projectedLight.intensity = this.intensity;
    this.projectedLight.position = project_uCameraPosition;
    return this.projectedLight;
  }

}

exports.default = CameraLight;
//# sourceMappingURL=camera-light.js.map