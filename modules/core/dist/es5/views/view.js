"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _positions = require("../utils/positions");

var _deepEqual = require("../utils/deep-equal");

var _assert = _interopRequireDefault(require("../utils/assert"));

class View {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = null,
      x = 0,
      y = 0,
      width = '100%',
      height = '100%',
      projectionMatrix = null,
      fovy = 50,
      near = 0.1,
      far = 1000,
      modelMatrix = null,
      viewportInstance = null,
      type = _viewport.default
    } = props;
    (0, _assert.default)(!viewportInstance || viewportInstance instanceof _viewport.default);
    this.viewportInstance = viewportInstance;
    this.id = id || this.constructor.displayName || 'view';
    this.type = type;
    this.props = Object.assign({}, props, {
      projectionMatrix,
      fovy,
      near,
      far,
      modelMatrix
    });

    this._parseDimensions({
      x,
      y,
      width,
      height
    });

    this.equals = this.equals.bind(this);
    Object.seal(this);
  }

  equals(view) {
    if (this === view) {
      return true;
    }

    if (this.viewportInstance) {
      return view.viewportInstance && this.viewportInstance.equals(view.viewportInstance);
    }

    const viewChanged = (0, _deepEqual.deepEqual)(this.props, view.props);
    return viewChanged;
  }

  makeViewport(_ref) {
    let {
      width,
      height,
      viewState
    } = _ref;

    if (this.viewportInstance) {
      return this.viewportInstance;
    }

    viewState = this.filterViewState(viewState);
    const viewportDimensions = this.getDimensions({
      width,
      height
    });
    const props = Object.assign({
      viewState
    }, viewState, this.props, viewportDimensions);
    return this._getViewport(props);
  }

  getViewStateId() {
    switch (typeof this.props.viewState) {
      case 'string':
        return this.props.viewState;

      case 'object':
        return this.props.viewState && this.props.viewState.id;

      default:
        return this.id;
    }
  }

  filterViewState(viewState) {
    if (this.props.viewState && typeof this.props.viewState === 'object') {
      if (!this.props.viewState.id) {
        return this.props.viewState;
      }

      const newViewState = Object.assign({}, viewState);

      for (const key in this.props.viewState) {
        if (key !== 'id') {
          newViewState[key] = this.props.viewState[key];
        }
      }

      return newViewState;
    }

    return viewState;
  }

  getDimensions(_ref2) {
    let {
      width,
      height
    } = _ref2;
    return {
      x: (0, _positions.getPosition)(this._x, width),
      y: (0, _positions.getPosition)(this._y, height),
      width: (0, _positions.getPosition)(this._width, width),
      height: (0, _positions.getPosition)(this._height, height)
    };
  }

  _getControllerProps(defaultOpts) {
    let opts = this.props.controller;

    if (!opts) {
      return null;
    }

    if (opts === true) {
      return defaultOpts;
    }

    if (typeof opts === 'function') {
      opts = {
        type: opts
      };
    }

    return Object.assign({}, defaultOpts, opts);
  }

  _getViewport(props) {
    const {
      type: ViewportType
    } = this;
    return new ViewportType(props);
  }

  _parseDimensions(_ref3) {
    let {
      x,
      y,
      width,
      height
    } = _ref3;
    this._x = (0, _positions.parsePosition)(x);
    this._y = (0, _positions.parsePosition)(y);
    this._width = (0, _positions.parsePosition)(width);
    this._height = (0, _positions.parsePosition)(height);
  }

}

exports.default = View;
//# sourceMappingURL=view.js.map