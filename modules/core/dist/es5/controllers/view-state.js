"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _math = require("math.gl");

var _assert = _interopRequireDefault(require("../utils/assert"));

const defaultState = {
  position: [0, 0, 0],
  lookAt: [0, 0, 0],
  up: [0, 0, 1],
  rotationX: 0,
  rotationY: 0,
  fov: 50,
  near: 1,
  far: 100
};

class ViewState {
  constructor(opts) {
    const {
      width,
      height,
      position = defaultState.position
    } = opts;
    (0, _assert.default)(Number.isFinite(width), '`width` must be supplied');
    (0, _assert.default)(Number.isFinite(height), '`height` must be supplied');
    this._viewportProps = this._applyConstraints(Object.assign({}, opts, {
      position: new _math.Vector3(position)
    }));
  }

  getViewportProps() {
    return this._viewportProps;
  }

  getDirection() {
    const spherical = new _math._SphericalCoordinates({
      bearing: this._viewportProps.bearing,
      pitch: this._viewportProps.pitch
    });
    const direction = spherical.toVector3().normalize();
    return direction;
  }

  getDirectionFromBearing(bearing) {
    const spherical = new _math._SphericalCoordinates({
      bearing,
      pitch: 90
    });
    const direction = spherical.toVector3().normalize();
    return direction;
  }

  shortestPathFrom(viewState) {
    return this._viewportProps;
  }

  _applyConstraints(props) {
    return props;
  }

}

exports.default = ViewState;
//# sourceMappingURL=view-state.js.map