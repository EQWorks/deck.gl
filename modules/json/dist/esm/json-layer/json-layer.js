import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { getJSONLayers } from '../parsers/convert-json';
var defaultProps = {
  configuration: []
};

var JSONLayer = function (_CompositeLayer) {
  _inherits(JSONLayer, _CompositeLayer);

  function JSONLayer() {
    _classCallCheck(this, JSONLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(JSONLayer).apply(this, arguments));
  }

  _createClass(JSONLayer, [{
    key: "initializeState",
    value: function initializeState() {
      this.state = {
        layers: []
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps;
      var layersChanged = props.data !== oldProps.data || props.configuration !== oldProps.configuration;

      if (layersChanged) {
        var data = typeof props.data === 'string' ? JSON.parse(props.data) : props.data;
        this.state.layers = getJSONLayers(data, props.configuration);
      }
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      return this.state.layers;
    }
  }]);

  return JSONLayer;
}(CompositeLayer);

export { JSONLayer as default };
JSONLayer.layerName = 'JSONLayer';
JSONLayer.defaultProps = defaultProps;
//# sourceMappingURL=json-layer.js.map