"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _componentState = _interopRequireDefault(require("../lifecycle/component-state"));

class LayerState extends _componentState.default {
  constructor(_ref) {
    let {
      attributeManager,
      layer
    } = _ref;
    super(layer);
    this.attributeManager = attributeManager;
    this.model = null;
    this.needsRedraw = true;
    this.subLayers = null;
  }

  get layer() {
    return this.component;
  }

  set layer(layer) {
    this.component = layer;
  }

}

exports.default = LayerState;
//# sourceMappingURL=layer-state.js.map