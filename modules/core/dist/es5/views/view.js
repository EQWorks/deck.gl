"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _positions = require("../utils/positions");

var _deepEqual = require("../utils/deep-equal");

var _assert = _interopRequireDefault(require("../utils/assert"));

var View = function () {
  function View() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, View);
    var _props$id = props.id,
        id = _props$id === void 0 ? null : _props$id,
        _props$x = props.x,
        x = _props$x === void 0 ? 0 : _props$x,
        _props$y = props.y,
        y = _props$y === void 0 ? 0 : _props$y,
        _props$width = props.width,
        width = _props$width === void 0 ? '100%' : _props$width,
        _props$height = props.height,
        height = _props$height === void 0 ? '100%' : _props$height,
        _props$projectionMatr = props.projectionMatrix,
        projectionMatrix = _props$projectionMatr === void 0 ? null : _props$projectionMatr,
        _props$fovy = props.fovy,
        fovy = _props$fovy === void 0 ? 50 : _props$fovy,
        _props$near = props.near,
        near = _props$near === void 0 ? 0.1 : _props$near,
        _props$far = props.far,
        far = _props$far === void 0 ? 1000 : _props$far,
        _props$modelMatrix = props.modelMatrix,
        modelMatrix = _props$modelMatrix === void 0 ? null : _props$modelMatrix,
        _props$viewportInstan = props.viewportInstance,
        viewportInstance = _props$viewportInstan === void 0 ? null : _props$viewportInstan,
        _props$type = props.type,
        type = _props$type === void 0 ? _viewport.default : _props$type;
    (0, _assert.default)(!viewportInstance || viewportInstance instanceof _viewport.default);
    this.viewportInstance = viewportInstance;
    this.id = id || this.constructor.displayName || 'view';
    this.type = type;
    this.props = Object.assign({}, props, {
      projectionMatrix: projectionMatrix,
      fovy: fovy,
      near: near,
      far: far,
      modelMatrix: modelMatrix
    });

    this._parseDimensions({
      x: x,
      y: y,
      width: width,
      height: height
    });

    this.equals = this.equals.bind(this);
    Object.seal(this);
  }

  (0, _createClass2.default)(View, [{
    key: "equals",
    value: function equals(view) {
      if (this === view) {
        return true;
      }

      if (this.viewportInstance) {
        return view.viewportInstance && this.viewportInstance.equals(view.viewportInstance);
      }

      var viewChanged = (0, _deepEqual.deepEqual)(this.props, view.props);
      return viewChanged;
    }
  }, {
    key: "makeViewport",
    value: function makeViewport(_ref) {
      var width = _ref.width,
          height = _ref.height,
          viewState = _ref.viewState;

      if (this.viewportInstance) {
        return this.viewportInstance;
      }

      viewState = this.filterViewState(viewState);
      var viewportDimensions = this.getDimensions({
        width: width,
        height: height
      });
      var props = Object.assign({
        viewState: viewState
      }, viewState, this.props, viewportDimensions);
      return this._getViewport(props);
    }
  }, {
    key: "getViewStateId",
    value: function getViewStateId() {
      switch ((0, _typeof2.default)(this.props.viewState)) {
        case 'string':
          return this.props.viewState;

        case 'object':
          return this.props.viewState && this.props.viewState.id;

        default:
          return this.id;
      }
    }
  }, {
    key: "filterViewState",
    value: function filterViewState(viewState) {
      if (this.props.viewState && (0, _typeof2.default)(this.props.viewState) === 'object') {
        if (!this.props.viewState.id) {
          return this.props.viewState;
        }

        var newViewState = Object.assign({}, viewState);

        for (var key in this.props.viewState) {
          if (key !== 'id') {
            newViewState[key] = this.props.viewState[key];
          }
        }

        return newViewState;
      }

      return viewState;
    }
  }, {
    key: "getDimensions",
    value: function getDimensions(_ref2) {
      var width = _ref2.width,
          height = _ref2.height;
      return {
        x: (0, _positions.getPosition)(this._x, width),
        y: (0, _positions.getPosition)(this._y, height),
        width: (0, _positions.getPosition)(this._width, width),
        height: (0, _positions.getPosition)(this._height, height)
      };
    }
  }, {
    key: "_getControllerProps",
    value: function _getControllerProps(defaultOpts) {
      var opts = this.props.controller;

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
  }, {
    key: "_getViewport",
    value: function _getViewport(props) {
      var ViewportType = this.type;
      return new ViewportType(props);
    }
  }, {
    key: "_parseDimensions",
    value: function _parseDimensions(_ref3) {
      var x = _ref3.x,
          y = _ref3.y,
          width = _ref3.width,
          height = _ref3.height;
      this._x = (0, _positions.parsePosition)(x);
      this._y = (0, _positions.parsePosition)(y);
      this._width = (0, _positions.parsePosition)(width);
      this._height = (0, _positions.parsePosition)(height);
    }
  }]);
  return View;
}();

exports.default = View;
//# sourceMappingURL=view.js.map