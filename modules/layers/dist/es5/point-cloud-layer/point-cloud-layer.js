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

var _pointCloudLayerVertex = _interopRequireDefault(require("./point-cloud-layer-vertex.glsl"));

var _pointCloudLayerFragment = _interopRequireDefault(require("./point-cloud-layer-fragment.glsl"));

var fp64LowPart = _core.fp64.fp64LowPart;
var DEFAULT_COLOR = [0, 0, 0, 255];
var DEFAULT_NORMAL = [0, 0, 1];
var defaultMaterial = new _core.PhongMaterial();
var defaultProps = {
  sizeUnits: 'pixels',
  pointSize: {
    type: 'number',
    min: 0,
    value: 10
  },
  fp64: false,
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getNormal: {
    type: 'accessor',
    value: DEFAULT_NORMAL
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  material: defaultMaterial,
  radiusPixels: {
    deprecatedFor: 'pointSize'
  }
};

var PointCloudLayer = function (_Layer) {
  (0, _inherits2.default)(PointCloudLayer, _Layer);

  function PointCloudLayer() {
    (0, _classCallCheck2.default)(this, PointCloudLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(PointCloudLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(PointCloudLayer, [{
    key: "getShaders",
    value: function getShaders(id) {
      var projectModule = this.use64bitProjection() ? 'project64' : 'project32';
      return {
        vs: _pointCloudLayerVertex.default,
        fs: _pointCloudLayerFragment.default,
        modules: [projectModule, 'gouraud-lighting', 'picking']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      this.getAttributeManager().addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: 'getPosition'
        },
        instancePositions64xyLow: {
          size: 2,
          accessor: 'getPosition',
          update: this.calculateInstancePositions64xyLow
        },
        instanceNormals: {
          size: 3,
          transition: true,
          accessor: 'getNormal',
          defaultValue: DEFAULT_NORMAL
        },
        instanceColors: {
          size: 4,
          type: 5121,
          transition: true,
          accessor: 'getColor',
          defaultValue: DEFAULT_COLOR
        }
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;
      (0, _get2.default)((0, _getPrototypeOf2.default)(PointCloudLayer.prototype), "updateState", this).call(this, {
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
          pointSize = _this$props.pointSize,
          sizeUnits = _this$props.sizeUnits;
      var sizeMultiplier = sizeUnits === 'meters' ? viewport.distanceScales.pixelsPerMeter[2] : 1;
      this.state.model.setUniforms(Object.assign({}, uniforms, {
        radiusPixels: pointSize * sizeMultiplier
      })).draw();
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      var positions = [];

      for (var i = 0; i < 3; i++) {
        var angle = i / 3 * Math.PI * 2;
        positions.push(Math.cos(angle) * 2, Math.sin(angle) * 2, 0);
      }

      return new _core.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _core.Geometry({
          drawMode: 4,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "calculateInstancePositions64xyLow",
    value: function calculateInstancePositions64xyLow(attribute, _ref3) {
      var startRow = _ref3.startRow,
          endRow = _ref3.endRow;
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(2);
        return;
      }

      var _this$props2 = this.props,
          data = _this$props2.data,
          getPosition = _this$props2.getPosition;
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
          var position = getPosition(object, objectInfo);
          value[i++] = fp64LowPart(position[0]);
          value[i++] = fp64LowPart(position[1]);
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
  return PointCloudLayer;
}(_keplerOutdatedDeck.Layer);

exports.default = PointCloudLayer;
PointCloudLayer.layerName = 'PointCloudLayer';
PointCloudLayer.defaultProps = defaultProps;
//# sourceMappingURL=point-cloud-layer.js.map