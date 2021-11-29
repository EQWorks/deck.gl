"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _core = require("@luma.gl/core");

var _lineLayerVertex = _interopRequireDefault(require("./line-layer-vertex.glsl"));

var _lineLayerFragment = _interopRequireDefault(require("./line-layer-fragment.glsl"));

var fp64LowPart = _core.fp64.fp64LowPart;
var DEFAULT_COLOR = [0, 0, 0, 255];
var defaultProps = {
  fp64: false,
  getSourcePosition: {
    type: 'accessor',
    value: function value(x) {
      return x.sourcePosition;
    }
  },
  getTargetPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.targetPosition;
    }
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getWidth: {
    type: 'accessor',
    value: 1
  },
  widthUnits: 'pixels',
  widthScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  widthMinPixels: {
    type: 'number',
    value: 0,
    min: 0
  },
  widthMaxPixels: {
    type: 'number',
    value: Number.MAX_SAFE_INTEGER,
    min: 0
  },
  getStrokeWidth: {
    deprecatedFor: 'getWidth'
  }
};

var LineLayer = function (_Layer) {
  (0, _inherits2.default)(LineLayer, _Layer);

  function LineLayer() {
    (0, _classCallCheck2.default)(this, LineLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(LineLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(LineLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var projectModule = this.use64bitProjection() ? 'project64' : 'project32';
      return {
        vs: _lineLayerVertex.default,
        fs: _lineLayerFragment.default,
        modules: [projectModule, 'picking']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instanceSourcePositions: {
          size: 3,
          transition: true,
          accessor: 'getSourcePosition'
        },
        instanceTargetPositions: {
          size: 3,
          transition: true,
          accessor: 'getTargetPosition'
        },
        instanceSourceTargetPositions64xyLow: {
          size: 4,
          accessor: ['getSourcePosition', 'getTargetPosition'],
          update: this.calculateInstanceSourceTargetPositions64xyLow
        },
        instanceColors: {
          size: 4,
          type: 5121,
          transition: true,
          accessor: 'getColor',
          defaultValue: [0, 0, 0, 255]
        },
        instanceWidths: {
          size: 1,
          transition: true,
          accessor: 'getWidth',
          defaultValue: 1
        }
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;
      (0, _get2.default)((0, _getPrototypeOf2.default)(LineLayer.prototype), "updateState", this).call(this, {
        props: props,
        oldProps: oldProps,
        changeFlags: changeFlags
      });

      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        if (this.state.model) {
          this.state.model.delete();
        }

        this.setState({
          model: this._getModel(gl)
        });
        this.getAttributeManager().invalidateAll();
      }
    }
  }, {
    key: "draw",
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var viewport = this.context.viewport;
      var _this$props = this.props,
          widthUnits = _this$props.widthUnits,
          widthScale = _this$props.widthScale,
          widthMinPixels = _this$props.widthMinPixels,
          widthMaxPixels = _this$props.widthMaxPixels;
      var widthMultiplier = widthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
      this.state.model.setUniforms(Object.assign({}, uniforms, {
        widthScale: widthScale * widthMultiplier,
        widthMinPixels: widthMinPixels,
        widthMaxPixels: widthMaxPixels
      })).draw();
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      var positions = [0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0];
      return new _core.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _core.Geometry({
          drawMode: 5,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "calculateInstanceSourceTargetPositions64xyLow",
    value: function calculateInstanceSourceTargetPositions64xyLow(attribute, _ref3) {
      var startRow = _ref3.startRow,
          endRow = _ref3.endRow;
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(4);
        return;
      }

      var _this$props2 = this.props,
          data = _this$props2.data,
          getSourcePosition = _this$props2.getSourcePosition,
          getTargetPosition = _this$props2.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;
      var i = startRow * size;

      var _createIterable = (0, _keplerOutdatedDeck.createIterable)(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;
          var sourcePosition = getSourcePosition(object, objectInfo);
          var targetPosition = getTargetPosition(object, objectInfo);
          value[i++] = fp64LowPart(sourcePosition[0]);
          value[i++] = fp64LowPart(sourcePosition[1]);
          value[i++] = fp64LowPart(targetPosition[0]);
          value[i++] = fp64LowPart(targetPosition[1]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);
  return LineLayer;
}(_keplerOutdatedDeck.Layer);

exports.default = LineLayer;
LineLayer.layerName = 'LineLayer';
LineLayer.defaultProps = defaultProps;
//# sourceMappingURL=line-layer.js.map