import LayersPass from './layers-pass';
import { withParameters } from 'kepler-outdated-luma.gl-core';
export default class PickLayersPass extends LayersPass {
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
    return withParameters(gl, {
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
//# sourceMappingURL=pick-layers-pass.js.map