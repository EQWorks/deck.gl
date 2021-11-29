"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _math = require("math.gl");

var _firstPersonController = _interopRequireDefault(require("../controllers/first-person-controller"));

function getDirectionFromBearingAndPitch(_ref) {
  let {
    bearing,
    pitch
  } = _ref;
  const spherical = new _math._SphericalCoordinates({
    bearing,
    pitch
  });
  const direction = spherical.toVector3().normalize();
  return direction;
}

class FirstPersonView extends _view.default {
  get controller() {
    return this._getControllerProps({
      type: _firstPersonController.default
    });
  }

  _getViewport(props) {
    const {
      modelMatrix = null,
      bearing,
      up = [0, 0, 1]
    } = props.viewState;
    const dir = getDirectionFromBearingAndPitch({
      bearing,
      pitch: 89
    });
    const center = modelMatrix ? modelMatrix.transformDirection(dir) : dir;
    const viewMatrix = new _math.Matrix4().lookAt({
      eye: [0, 0, 0],
      center,
      up
    });
    return new _viewport.default(Object.assign({}, props, {
      zoom: null,
      viewMatrix
    }));
  }

}

exports.default = FirstPersonView;
FirstPersonView.displayName = 'FirstPersonView';
//# sourceMappingURL=first-person-view.js.map