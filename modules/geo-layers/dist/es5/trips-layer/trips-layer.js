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

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-layers");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-core");

var defaultProps = {
  trailLength: {
    type: 'number',
    value: 120,
    min: 0
  },
  currentTime: {
    type: 'number',
    value: 0,
    min: 0
  },
  getTimestamps: {
    type: 'accessor',
    value: null
  }
};

var TripsLayer = function (_PathLayer) {
  (0, _inherits2.default)(TripsLayer, _PathLayer);

  function TripsLayer() {
    (0, _classCallCheck2.default)(this, TripsLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(TripsLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(TripsLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var shaders = (0, _get2.default)((0, _getPrototypeOf2.default)(TripsLayer.prototype), "getShaders", this).call(this);
      shaders.inject = {
        'vs:#decl': "uniform float trailLength;\nuniform bool isPath3D;\nattribute vec2 instanceTimestamps;\nvarying float vTime;\n",
        'vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);': "vec2 timestamps = instanceTimestamps;\nif (!isPath3D) {\n  prevPosition.z = 0.0;\n  currPosition.z = 0.0;\n  nextPosition.z = 0.0;\n  timestamps.x = instanceStartPositions.z;\n  timestamps.y = instanceEndPositions.z;\n}\n",
        'vs:#main-end': "float shiftZ = sin(timestamps.x) * 1e-4;\ngl_Position.z += shiftZ;\nvTime = timestamps.x + (timestamps.y - timestamps.x) * vPathPosition.y / vPathLength;\n",
        'fs:#decl': "uniform float trailLength;\nuniform float currentTime;\nvarying float vTime;\n",
        'fs:#main-start': "if(vTime > currentTime || vTime < currentTime - trailLength) {\n  discard;\n}\n",
        'gl_FragColor = vColor;': 'gl_FragColor.a *= 1.0 - (currentTime - vTime) / trailLength;'
      };
      return shaders;
    }
  }, {
    key: "initializeState",
    value: function initializeState(params) {
      (0, _get2.default)((0, _getPrototypeOf2.default)(TripsLayer.prototype), "initializeState", this).call(this, params);
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instanceTimestamps: {
          size: 2,
          update: this.calculateInstanceTimestamps
        }
      });
    }
  }, {
    key: "draw",
    value: function draw(params) {
      var _this$props = this.props,
          trailLength = _this$props.trailLength,
          currentTime = _this$props.currentTime,
          getTimestamps = _this$props.getTimestamps;
      params.uniforms = Object.assign({}, params.uniforms, {
        trailLength: trailLength,
        currentTime: currentTime,
        isPath3D: Boolean(getTimestamps)
      });
      (0, _get2.default)((0, _getPrototypeOf2.default)(TripsLayer.prototype), "draw", this).call(this, params);
    }
  }, {
    key: "calculateInstanceTimestamps",
    value: function calculateInstanceTimestamps(attribute, _ref) {
      var startRow = _ref.startRow,
          endRow = _ref.endRow;
      var _this$props2 = this.props,
          data = _this$props2.data,
          getTimestamps = _this$props2.getTimestamps;

      if (!getTimestamps) {
        attribute.constant = true;
        attribute.value = new Float32Array(2);
        return;
      }

      var _this$state$pathTesse = this.state.pathTesselator,
          bufferLayout = _this$state$pathTesse.bufferLayout,
          instanceCount = _this$state$pathTesse.instanceCount;
      var value = new Float32Array(instanceCount * 2);

      var _createIterable = (0, _keplerOutdatedDeck2.createIterable)(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var i = 0;

      for (var objectIndex = 0; objectIndex < startRow; objectIndex++) {
        i += bufferLayout[objectIndex] * 2;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;
          var geometrySize = bufferLayout[objectInfo.index];
          var timestamps = getTimestamps(object, objectInfo);

          for (var j = 0; j < geometrySize; j++) {
            value[i++] = timestamps[j];
            value[i++] = timestamps[j + 1];
          }
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

      attribute.constant = false;
      attribute.value = value;
    }
  }]);
  return TripsLayer;
}(_keplerOutdatedDeck.PathLayer);

exports.default = TripsLayer;
TripsLayer.layerName = 'TripsLayer';
TripsLayer.defaultProps = defaultProps;
//# sourceMappingURL=trips-layer.js.map