"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _math = require("math.gl");

var _orbitController = _interopRequireDefault(require("../controllers/orbit-controller"));

const DEGREES_TO_RADIANS = Math.PI / 180;

function getViewMatrix(_ref) {
  let {
    height,
    fovy,
    orbitAxis,
    rotationX,
    rotationOrbit,
    zoom
  } = _ref;
  const distance = 0.5 / Math.tan(fovy * DEGREES_TO_RADIANS / 2);
  const viewMatrix = new _math.Matrix4().lookAt({
    eye: [0, 0, distance]
  });
  viewMatrix.rotateX(rotationX * DEGREES_TO_RADIANS);

  if (orbitAxis === 'Z') {
    viewMatrix.rotateZ(rotationOrbit * DEGREES_TO_RADIANS);
  } else {
    viewMatrix.rotateY(rotationOrbit * DEGREES_TO_RADIANS);
  }

  const projectionScale = 1 / (height || 1);
  viewMatrix.scale([projectionScale, projectionScale, projectionScale]);
  return viewMatrix;
}

class OrbitViewport extends _viewport.default {
  constructor(props) {
    const {
      id,
      x,
      y,
      width,
      height,
      fovy = 50,
      near,
      far,
      orbitAxis = 'Z',
      target = [0, 0, 0],
      rotationX = 0,
      rotationOrbit = 0,
      zoom = 0
    } = props;
    super({
      id,
      viewMatrix: getViewMatrix({
        height,
        fovy,
        orbitAxis,
        rotationX,
        rotationOrbit,
        zoom
      }),
      fovy,
      near,
      far,
      x,
      y,
      position: target,
      width,
      height,
      zoom
    });
  }

}

class OrbitView extends _view.default {
  constructor(props) {
    super(Object.assign({}, props, {
      type: OrbitViewport
    }));
  }

  get controller() {
    return this._getControllerProps({
      type: _orbitController.default,
      ViewportType: OrbitViewport
    });
  }

}

exports.default = OrbitView;
OrbitView.displayName = 'OrbitView';
//# sourceMappingURL=orbit-view.js.map