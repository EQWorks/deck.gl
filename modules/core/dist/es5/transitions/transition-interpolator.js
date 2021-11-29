"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _math = require("math.gl");

var _assert = _interopRequireDefault(require("../utils/assert"));

class TransitionInterpolator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (Array.isArray(opts)) {
      opts = {
        compare: opts,
        extract: opts,
        required: opts
      };
    }

    const {
      compare,
      extract,
      required
    } = opts;
    this._propsToCompare = compare;
    this._propsToExtract = extract;
    this._requiredProps = required;
  }

  arePropsEqual(currentProps, nextProps) {
    for (const key of this._propsToCompare || Object.keys(nextProps)) {
      if (!(0, _math.equals)(currentProps[key], nextProps[key])) {
        return false;
      }
    }

    return true;
  }

  initializeProps(startProps, endProps) {
    let result;

    if (this._propsToExtract) {
      const startViewStateProps = {};
      const endViewStateProps = {};

      for (const key of this._propsToExtract) {
        startViewStateProps[key] = startProps[key];
        endViewStateProps[key] = endProps[key];
      }

      result = {
        start: startViewStateProps,
        end: endViewStateProps
      };
    } else {
      result = {
        start: startProps,
        end: endProps
      };
    }

    this._checkRequiredProps(result.start);

    this._checkRequiredProps(result.end);

    return result;
  }

  interpolateProps(startProps, endProps, t) {
    (0, _assert.default)(false, 'interpolateProps is not implemented');
  }

  _checkRequiredProps(props) {
    if (!this._requiredProps) {
      return;
    }

    this._requiredProps.forEach(propName => {
      const value = props[propName];
      (0, _assert.default)(Number.isFinite(value) || Array.isArray(value), "".concat(propName, " is required for transition"));
    });
  }

}

exports.default = TransitionInterpolator;
//# sourceMappingURL=transition-interpolator.js.map