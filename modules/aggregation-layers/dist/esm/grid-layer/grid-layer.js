import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import GPUGridLayer from '../gpu-grid-layer/gpu-grid-layer';
import CPUGridLayer from '../cpu-grid-layer/cpu-grid-layer';
const defaultProps = Object.assign({}, GPUGridLayer.defaultProps, CPUGridLayer.defaultProps, {
  gpuAggregation: false
});
export default class GridLayer extends CompositeLayer {
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
    const LayerType = this.state.useGPUAggregation ? this.getSubLayerClass('GPU', GPUGridLayer) : this.getSubLayerClass('CPU', CPUGridLayer);
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

    if (!GPUGridAggregator.isSupported(this.context.gl)) {
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
GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=grid-layer.js.map