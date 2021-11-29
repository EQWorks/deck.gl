"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _layersPass = _interopRequireDefault(require("./layers-pass"));

var _core = require("@luma.gl/core");

class PickLayersPass extends _layersPass.default {
  render(props) {
    if (props.pickingFBO) {
      this.drawPickingBuffer(props);
    } else {
      super.render(props);
    }
  }

  drawPickingBuffer(_ref) {
    let {
      layers,
      viewports,
      onViewportActive,
      pickingFBO,
      effectProps,
      deviceRect: {
        x,
        y,
        width,
        height
      },
      redrawReason = ''
    } = _ref;
    const gl = this.gl;
    return (0, _core.withParameters)(gl, {
      framebuffer: pickingFBO,
      scissorTest: true,
      scissor: [x, y, width, height],
      clearColor: [0, 0, 0, 0]
    }, () => {
      this.drawLayers({
        layers,
        viewports,
        onViewportActive,
        pass: 'picking',
        redrawReason,
        effectProps,
        parameters: {
          blend: true,
          blendFunc: [1, 0, 32771, 0],
          blendEquation: 32774,
          blendColor: [0, 0, 0, 0],
          depthMask: true,
          depthTest: true,
          depthRange: [0, 1],
          colorMask: [true, true, true, true]
        }
      });
    });
  }

  shouldDrawLayer(layer, viewport) {
    const layerFilter = this.props.layerFilter;
    let shouldDrawLayer = !layer.isComposite && layer.props.visible && layer.props.pickable;

    if (shouldDrawLayer && layerFilter) {
      shouldDrawLayer = layerFilter({
        layer,
        viewport,
        isPicking: true
      });
    }

    return shouldDrawLayer;
  }

  getModuleParameters(layer, effects, effectProps) {
    const moduleParameters = Object.assign(Object.create(layer.props), {
      viewport: layer.context.viewport,
      pickingActive: 1,
      devicePixelRatio: this.props.pixelRatio
    });
    Object.assign(moduleParameters, effectProps);
    return moduleParameters;
  }

  getLayerParameters(layer, layerIndex, glViewport, parameters) {
    const layerParameters = Object.assign({}, layer.props.parameters || {}, parameters);
    Object.assign(layerParameters, {
      viewport: glViewport,
      blendColor: [0, 0, 0, (layerIndex + 1) / 255]
    });
    return layerParameters;
  }

}

exports.default = PickLayersPass;
//# sourceMappingURL=pick-layers-pass.js.map