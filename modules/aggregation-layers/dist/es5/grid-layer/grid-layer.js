"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _gpuGridLayer = _interopRequireDefault(require("../gpu-grid-layer/gpu-grid-layer"));

var _cpuGridLayer = _interopRequireDefault(require("../cpu-grid-layer/cpu-grid-layer"));

const defaultProps = Object.assign({}, _gpuGridLayer.default.defaultProps, _cpuGridLayer.default.defaultProps, {
  gpuAggregation: false
});

class GridLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      useGPUAggregation: true
    };
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    const newState = {};
    newState.useGPUAggregation = this.canUseGPUAggregation(props);
    this.setState(newState);
  }

  renderLayers() {
    const {
      data,
      updateTriggers
    } = this.props;
    const id = this.state.useGPUAggregation ? 'GPU' : 'CPU';
    const LayerType = this.state.useGPUAggregation ? this.getSubLayerClass('GPU', _gpuGridLayer.default) : this.getSubLayerClass('CPU', _cpuGridLayer.default);
    return new LayerType(this.props, this.getSubLayerProps({
      id,
      updateTriggers
    }), {
      data
    });
  }

  canUseGPUAggregation(props) {
    const {
      gpuAggregation,
      lowerPercentile,
      upperPercentile,
      getColorValue,
      getElevationValue
    } = props;

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

}

exports.default = GridLayer;
GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=grid-layer.js.map