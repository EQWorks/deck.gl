"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _convertJson = require("../parsers/convert-json");

const defaultProps = {
  configuration: []
};

class JSONLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      layers: []
    };
  }

  updateState(_ref) {
    let {
      props,
      oldProps
    } = _ref;
    const layersChanged = props.data !== oldProps.data || props.configuration !== oldProps.configuration;

    if (layersChanged) {
      const data = typeof props.data === 'string' ? JSON.parse(props.data) : props.data;
      this.state.layers = (0, _convertJson.getJSONLayers)(data, props.configuration);
    }
  }

  renderLayers() {
    return this.state.layers;
  }

}

exports.default = JSONLayer;
JSONLayer.layerName = 'JSONLayer';
JSONLayer.defaultProps = defaultProps;
//# sourceMappingURL=json-layer.js.map