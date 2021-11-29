"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _math = require("math.gl");

function getDirectionFromBearingAndPitch(_ref) {
  let {
    bearing,
    pitch
  } = _ref;
  const spherical = new _math._SphericalCoordinates({
    bearing,
    pitch
  });
  return spherical.toVector3().normalize();
}

class ThirdPersonView extends _view.default {
  _getViewport(props) {
    const {
      bearing,
      pitch,
      position,
      up,
      zoom
    } = props.viewState;
    const direction = getDirectionFromBearingAndPitch({
      bearing,
      pitch
    });
    const distance = zoom * 50;
    const eye = direction.scale(-distance).multiply(new _math.Vector3(1, 1, -1));
    const viewMatrix = new _math.Matrix4().multiplyRight(new _math.Matrix4().lookAt({
      eye,
      center: position,
      up
    }));
    return new _viewport.default(Object.assign({}, props, {
      id: this.id,
      zoom: null,
      viewMatrix
    }));
  }

}

exports.default = ThirdPersonView;
ThirdPersonView.displayName = 'ThirdPersonView';
//# sourceMappingURL=third-person-view.js.map