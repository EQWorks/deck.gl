"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _transitionInterpolator = _interopRequireDefault(require("./transition-interpolator"));

var _math = require("math.gl");

var _viewportMercatorProject = require("viewport-mercator-project");

const LINEARLY_INTERPOLATED_PROPS = ['bearing', 'pitch'];

class FlyToInterpolator extends _transitionInterpolator.default {
  constructor() {
    super({
      compare: ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'],
      extract: ['width', 'height', 'longitude', 'latitude', 'zoom', 'bearing', 'pitch'],
      required: ['width', 'height', 'latitude', 'longitude', 'zoom']
    });
  }

  interpolateProps(startProps, endProps, t) {
    const viewport = (0, _viewportMercatorProject.flyToViewport)(startProps, endProps, t);

    for (const key of LINEARLY_INTERPOLATED_PROPS) {
      viewport[key] = (0, _math.lerp)(startProps[key] || 0, endProps[key] || 0, t);
    }

    return viewport;
  }

}

exports.default = FlyToInterpolator;
//# sourceMappingURL=viewport-fly-to-interpolator.js.map