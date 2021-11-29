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

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _gpuGridLayer = _interopRequireDefault(require("../gpu-grid-layer/gpu-grid-layer"));

var _cpuGridLayer = _interopRequireDefault(require("../cpu-grid-layer/cpu-grid-layer"));

var defaultProps = Object.assign({}, _gpuGridLayer.default.defaultProps, _cpuGridLayer.default.defaultProps, {
  gpuAggregation: false
});

var GridLayer = function (_CompositeLayer) {
  (0, _inherits2.default)(GridLayer, _CompositeLayer);

  function GridLayer() {
    (0, _classCallCheck2.default)(this, GridLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(GridLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(GridLayer, [{
    key: "initializeState",
    value: function initializeState() {
      this.state = {
        useGPUAggregation: true
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var newState = {};
      newState.useGPUAggregation = this.canUseGPUAggregation(props);
      this.setState(newState);
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this$props = this.props,
          data = _this$props.data,
          updateTriggers = _this$props.updateTriggers;
      var id = this.state.useGPUAggregation ? 'GPU' : 'CPU';
      var LayerType = this.state.useGPUAggregation ? this.getSubLayerClass('GPU', _gpuGridLayer.default) : this.getSubLayerClass('CPU', _cpuGridLayer.default);
      return new LayerType(this.props, this.getSubLayerProps({
        id: id,
        updateTriggers: updateTriggers
      }), {
        data: data
      });
    }
  }, {
    key: "canUseGPUAggregation",
    value: function canUseGPUAggregation(props) {
      var gpuAggregation = props.gpuAggregation,
          lowerPercentile = props.lowerPercentile,
          upperPercentile = props.upperPercentile,
          getColorValue = props.getColorValue,
          getElevationValue = props.getElevationValue;

      if (!gpuAggregation) {
        return false;
      }

      if (!_gpuGridAggregator.default.isSupported(this.context.gl)) {
        return false;
      }

      if (lowerPercentile !== 0 || upperPercentile !== 100) {
        return false;
      }

      if (getColorValue !== null || getElevationValue !== null) {
        return false;
      }

      return true;
    }
  }]);
  return GridLayer;
}(_keplerOutdatedDeck.CompositeLayer);

exports.default = GridLayer;
GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=grid-layer.js.map