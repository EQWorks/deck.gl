"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _math = require("math.gl");

var _orthographicController = _interopRequireDefault(require("../controllers/orthographic-controller"));

const viewMatrix = new _math.Matrix4().lookAt({
  eye: [0, 0, 1]
});

function getProjectionMatrix(_ref) {
  let {
    width,
    height,
    near,
    far
  } = _ref;
  width = width || 1;
  height = height || 1;
  return new _math.Matrix4().ortho({
    left: -width / 2,
    right: width / 2,
    bottom: height / 2,
    top: -height / 2,
    near,
    far
  });
}

class OrthographicViewport extends _viewport.default {
  constructor(_ref2) {
    let {
      id,
      x,
      y,
      width,
      height,
      near = 0.1,
      far = 1000,
      zoom = 0,
      target = [0, 0, 0]
    } = _ref2;
    return new _viewport.default({
      id,
      x,
      y,
      width,
      height,
      position: target,
      viewMatrix,
      projectionMatrix: getProjectionMatrix({
        width,
        height,
        near,
        far
      }),
      zoom
    });
  }

}

class OrthographicView extends _view.default {
  constructor(props) {
    super(Object.assign({}, props, {
      type: OrthographicViewport
    }));
  }

  get controller() {
    return this._getControllerProps({
      type: _orthographicController.default,
      ViewportType: OrthographicViewport
    });
  }

}

exports.default = OrthographicView;
OrthographicView.displayName = 'OrthographicView';
//# sourceMappingURL=orthographic-view.js.map