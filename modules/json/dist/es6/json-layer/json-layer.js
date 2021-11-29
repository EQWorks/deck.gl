import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { getJSONLayers } from '../parsers/convert-json';
const defaultProps = {
  configuration: []
};
export default class JSONLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layers: []
    };
  }

  updateState(_ref) {
    let props = _ref.props,
        oldProps = _ref.oldProps;
    const layersChanged = props.data !== oldProps.data || props.configuration !== oldProps.configuration;

    if (layersChanged) {
      const data = typeof props.data === 'string' ? JSON.parse(props.data) : props.data;
      this.state.layers = getJSONLayers(data, props.configuration);
    }
  }

  renderLayers() {
    return this.state.layers;
  }

}
JSONLayer.layerName = 'JSONLayer';
JSONLayer.defaultProps = defaultProps;
//# sourceMappingURL=json-layer.js.map