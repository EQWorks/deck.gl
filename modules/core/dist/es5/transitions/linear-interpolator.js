"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _transitionInterpolator = _interopRequireDefault(require("./transition-interpolator"));

var _math = require("math.gl");

const VIEWPORT_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];

class LinearInterpolator extends _transitionInterpolator.default {
  constructor() {
    let transitionProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : VIEWPORT_TRANSITION_PROPS;
    super(transitionProps);
  }

  interpolateProps(startProps, endProps, t) {
    const viewport = {};

    for (const key in endProps) {
      viewport[key] = (0, _math.lerp)(startProps[key], endProps[key], t);
    }

    return viewport;
  }

}

exports.default = LinearInterpolator;
//# sourceMappingURL=linear-interpolator.js.map