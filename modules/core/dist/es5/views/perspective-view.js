"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var mat4 = _interopRequireWildcard(require("gl-matrix/mat4"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const DEGREES_TO_RADIANS = Math.PI / 180;

class PerspectiveView extends _view.default {
  _getViewport(props) {
    const {
      x,
      y,
      width,
      height,
      viewState
    } = props;
    const {
      eye,
      lookAt = [0, 0, 0],
      up = [0, 1, 0]
    } = viewState;
    const fovy = props.fovy || viewState.fovy || 75;
    const near = props.near || viewState.near || 1;
    const far = props.far || viewState.far || 100;
    const aspect = Number.isFinite(viewState.aspect) ? viewState.aspect : width / height;
    const fovyRadians = fovy * DEGREES_TO_RADIANS;
    return new _viewport.default({
      id: this.id,
      x,
      y,
      width,
      height,
      viewMatrix: mat4.lookAt([], eye, lookAt, up),
      projectionMatrix: mat4.perspective([], fovyRadians, aspect, near, far)
    });
  }

}

exports.default = PerspectiveView;
PerspectiveView.displayName = 'PerspectiveView';
//# sourceMappingURL=perspective-view.js.map