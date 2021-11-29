"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _layersPass = _interopRequireDefault(require("./layers-pass"));

class DrawLayersPass extends _layersPass.default {
  getModuleParameters(layer, effects, effectProps) {
    const moduleParameters = super.getModuleParameters(layer);
    Object.assign(moduleParameters, this.getObjectHighlightParameters(layer), effectProps);

    for (const effect of effects) {
      Object.assign(moduleParameters, effect.getParameters(layer));
    }

    return moduleParameters;
  }

  getObjectHighlightParameters(layer) {
    const {
      highlightedObjectIndex,
      highlightColor
    } = layer.props;
    const parameters = {
      pickingHighlightColor: [highlightColor[0], highlightColor[1], highlightColor[2], highlightColor[3] || 255]
    };

    if (Number.isInteger(highlightedObjectIndex)) {
      parameters.pickingSelectedColor = highlightedObjectIndex >= 0 ? layer.encodePickingColor(highlightedObjectIndex) : null;
    }

    return parameters;
  }

}

exports.default = DrawLayersPass;
//# sourceMappingURL=draw-layers-pass.js.map