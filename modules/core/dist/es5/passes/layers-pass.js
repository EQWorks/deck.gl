"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pass = _interopRequireDefault(require("./pass"));

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

class LayersPass extends _pass.default {
  render(params) {
    const gl = this.gl;
    return (0, _keplerOutdatedLuma.withParameters)(gl, {
      framebuffer: params.outputBuffer
    }, () => this.drawLayers(params));
  }

  drawLayers(_ref) {
    let {
      layers,
      viewports,
      views,
      onViewportActive,
      deviceRect = null,
      parameters = {},
      pass = 'draw',
      redrawReason = '',
      clearCanvas = true,
      effects,
      effectProps
    } = _ref;
    const gl = this.gl;

    if (clearCanvas) {
      this.clearCanvas(gl);
    }

    const renderStats = [];
    viewports.forEach((viewportOrDescriptor, i) => {
      const viewport = this.getViewportFromDescriptor(viewportOrDescriptor);
      const view = views && views[viewport.id];
      onViewportActive(viewport);
      const stats = this.drawLayersInViewport(gl, {
        layers,
        viewport,
        view,
        deviceRect,
        parameters,
        pass,
        redrawReason,
        effects,
        effectProps
      });
      renderStats.push(stats);
    });
    return renderStats;
  }

  drawLayersInViewport(gl, _ref2) {
    let {
      layers,
      viewport,
      view,
      deviceRect = null,
      parameters = {},
      pass = 'draw',
      redrawReason = '',
      effects,
      effectProps
    } = _ref2;
    const glViewport = this.getGLViewport(gl, {
      viewport
    });

    if (view && view.props.clear) {
      const clearOpts = view.props.clear === true ? {
        color: true,
        depth: true
      } : view.props.clear;
      (0, _keplerOutdatedLuma.withParameters)(gl, {
        scissorTest: true,
        scissor: glViewport
      }, () => (0, _keplerOutdatedLuma.clear)(gl, clearOpts));
    }

    const renderStatus = {
      totalCount: layers.length,
      visibleCount: 0,
      compositeCount: 0,
      pickableCount: 0
    };
    (0, _keplerOutdatedLuma.setParameters)(gl, parameters || {});
    layers.forEach((layer, layerIndex) => {
      const shouldDrawLayer = this.shouldDrawLayer(layer, viewport);

      if (shouldDrawLayer && layer.props.pickable) {
        renderStatus.pickableCount++;
      }

      if (layer.isComposite) {
        renderStatus.compositeCount++;
      }

      if (shouldDrawLayer) {
        renderStatus.visibleCount++;
        this.drawLayerInViewport({
          gl,
          layer,
          layerIndex,
          glViewport,
          parameters,
          effects,
          effectProps
        });
      }
    });
    return renderStatus;
  }

  drawLayerInViewport(_ref3) {
    let {
      gl,
      layer,
      layerIndex,
      glViewport,
      parameters,
      effects,
      effectProps
    } = _ref3;
    const moduleParameters = this.getModuleParameters(layer, effects, effectProps);
    const uniforms = Object.assign({}, layer.context.uniforms, {
      layerIndex
    });
    const layerParameters = this.getLayerParameters(layer, layerIndex, glViewport, parameters);
    layer.drawLayer({
      moduleParameters,
      uniforms,
      parameters: layerParameters
    });
  }

  getViewportFromDescriptor(viewportOrDescriptor) {
    return viewportOrDescriptor.viewport ? viewportOrDescriptor.viewport : viewportOrDescriptor;
  }

  shouldDrawLayer(layer, viewport) {
    const layerFilter = this.props.layerFilter;
    let shouldDrawLayer = !layer.isComposite && layer.props.visible;

    if (shouldDrawLayer && layerFilter) {
      shouldDrawLayer = layerFilter({
        layer,
        viewport,
        isPicking: false
      });
    }

    return shouldDrawLayer;
  }

  getModuleParameters(layer) {
    const moduleParameters = Object.assign(Object.create(layer.props), {
      viewport: layer.context.viewport,
      pickingActive: 0,
      devicePixelRatio: this.props.pixelRatio
    });
    return moduleParameters;
  }

  getLayerParameters(layer, layerIndex, glViewport, parameters) {
    const layerParameters = Object.assign({}, layer.props.parameters || {}, parameters);
    Object.assign(layerParameters, {
      viewport: glViewport
    });
    return layerParameters;
  }

  getGLViewport(gl, _ref4) {
    let {
      viewport
    } = _ref4;
    const height = gl.canvas ? gl.canvas.clientHeight || gl.canvas.height : 100;
    const dimensions = viewport;
    const pixelRatio = this.props.pixelRatio;
    return [dimensions.x * pixelRatio, (height - dimensions.y - dimensions.height) * pixelRatio, dimensions.width * pixelRatio, dimensions.height * pixelRatio];
  }

  clearCanvas(gl) {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    (0, _keplerOutdatedLuma.withParameters)(gl, {
      viewport: [0, 0, width, height]
    }, () => {
      gl.clear(16384 | 256);
    });
  }

}

exports.default = LayersPass;
//# sourceMappingURL=layers-pass.js.map