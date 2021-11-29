"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _getPixelRatio = _interopRequireDefault(require("../utils/get-pixel-ratio"));

var _assert = _interopRequireDefault(require("../utils/assert"));

var _pickLayersPass = _interopRequireDefault(require("../passes/pick-layers-pass"));

var _queryObject = require("./picking/query-object");

var _pickInfo = require("./picking/pick-info");

class DeckPicker {
  constructor(gl) {
    this.gl = gl;
    this.pickingFBO = null;
    this.pickLayersPass = new _pickLayersPass.default(gl);
    this.pixelRatio = null;
    this.layerFilter = null;
    this.pickingEvent = null;
    this.lastPickedInfo = {
      index: -1,
      layerId: null,
      info: null
    };
  }

  setProps(props) {
    if ('useDevicePixels' in props) {
      this.pixelRatio = (0, _getPixelRatio.default)(props.useDevicePixels);
    }

    if ('layerFilter' in props) {
      this.layerFilter = props.layerFilter;
    }

    this.pickLayersPass.setProps({
      pixelRatio: this.pixelRatio,
      layerFilter: this.layerFilter
    });
  }

  pickObject(_ref) {
    let {
      x,
      y,
      mode,
      radius = 0,
      layers,
      viewports,
      activateViewport,
      depth = 1,
      event = null
    } = _ref;
    this.pickingEvent = event;
    const result = this.pickClosestObject({
      x,
      y,
      radius,
      layers,
      mode,
      depth,
      viewports,
      onViewportActive: activateViewport
    });
    this.pickingEvent = null;
    return result;
  }

  pickObjects(_ref2) {
    let {
      x,
      y,
      width,
      height,
      layers,
      viewports,
      activateViewport
    } = _ref2;
    return this.pickVisibleObjects({
      x,
      y,
      width,
      height,
      layers,
      mode: 'pickObjects',
      viewports,
      onViewportActive: activateViewport
    });
  }

  getLastPickedObject(_ref3) {
    let {
      x,
      y,
      layers,
      viewports
    } = _ref3;
    let lastPickedInfo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.lastPickedInfo.info;
    const lastPickedLayerId = lastPickedInfo && lastPickedInfo.layer && lastPickedInfo.layer.id;
    const layer = lastPickedLayerId ? layers.find(l => l.id === lastPickedLayerId) : null;
    const coordinate = viewports[0] && viewports[0].unproject([x, y]);
    const info = {
      x,
      y,
      coordinate,
      lngLat: coordinate,
      layer
    };

    if (layer) {
      return Object.assign({}, lastPickedInfo, info);
    }

    return Object.assign(info, {
      color: null,
      object: null,
      index: -1
    });
  }

  updatePickingBuffer() {
    const {
      gl
    } = this;

    if (!this.pickingFBO) {
      this.pickingFBO = new _core.Framebuffer(gl);
    }

    this.pickingFBO.resize({
      width: gl.canvas.width,
      height: gl.canvas.height
    });
    return this.pickingFBO;
  }

  pickClosestObject(_ref4) {
    let {
      layers,
      viewports,
      x,
      y,
      radius,
      depth = 1,
      mode,
      onViewportActive
    } = _ref4;
    this.updatePickingBuffer();
    const pixelRatio = this.pixelRatio;
    const deviceX = Math.round(x * pixelRatio);
    const deviceY = Math.round(this.gl.canvas.height - y * pixelRatio);
    const deviceRadius = Math.round(radius * pixelRatio);
    const {
      width,
      height
    } = this.pickingFBO;
    const deviceRect = this.getPickingRect({
      deviceX,
      deviceY,
      deviceRadius,
      deviceWidth: width,
      deviceHeight: height
    });
    let infos;
    const result = [];
    const affectedLayers = {};

    for (let i = 0; i < depth; i++) {
      const pickedColors = deviceRect && this.drawAndSamplePickingBuffer({
        layers,
        viewports,
        onViewportActive,
        deviceRect,
        redrawReason: mode
      });
      const pickInfo = (0, _queryObject.getClosestObject)({
        pickedColors,
        layers,
        deviceX,
        deviceY,
        deviceRadius,
        deviceRect
      });

      if (pickInfo.pickedColor && i + 1 < depth) {
        const layerId = pickInfo.pickedColor[3] - 1;

        if (!affectedLayers[layerId]) {
          affectedLayers[layerId] = layers[layerId].copyPickingColors();
        }

        layers[layerId].clearPickingColor(pickInfo.pickedColor);
      }

      infos = (0, _pickInfo.processPickInfo)({
        pickInfo,
        lastPickedInfo: this.lastPickedInfo,
        mode,
        layers,
        viewports,
        x,
        y,
        deviceX,
        deviceY,
        pixelRatio
      });
      const processedPickInfos = this.callLayerPickingCallbacks(infos, mode);

      if (processedPickInfos) {
        processedPickInfos.forEach(info => result.push(info));
      }

      if (!pickInfo.pickedColor) {
        break;
      }
    }

    Object.keys(affectedLayers).forEach(layerId => layers[layerId].restorePickingColors(affectedLayers[layerId]));
    return {
      result,
      emptyInfo: infos && infos.get(null)
    };
  }

  pickVisibleObjects(_ref5) {
    let {
      layers,
      viewports,
      x,
      y,
      width,
      height,
      mode,
      onViewportActive
    } = _ref5;
    this.updatePickingBuffer();
    const pixelRatio = this.pixelRatio;
    const deviceLeft = Math.round(x * pixelRatio);
    const deviceBottom = Math.round(this.gl.canvas.height - y * pixelRatio);
    const deviceRight = Math.round((x + width) * pixelRatio);
    const deviceTop = Math.round(this.gl.canvas.height - (y + height) * pixelRatio);
    const deviceRect = {
      x: deviceLeft,
      y: deviceTop,
      width: deviceRight - deviceLeft,
      height: deviceBottom - deviceTop
    };
    const pickedColors = this.drawAndSamplePickingBuffer({
      layers,
      viewports,
      onViewportActive,
      deviceRect,
      redrawReason: mode
    });
    const pickInfos = (0, _queryObject.getUniqueObjects)({
      pickedColors,
      layers
    });
    const uniqueInfos = new Map();
    pickInfos.forEach(pickInfo => {
      let info = {
        color: pickInfo.pickedColor,
        layer: null,
        index: pickInfo.pickedObjectIndex,
        picked: true,
        x,
        y,
        width,
        height,
        pixelRatio
      };
      info = (0, _pickInfo.getLayerPickingInfo)({
        layer: pickInfo.pickedLayer,
        info,
        mode
      });

      if (!uniqueInfos.has(info.object)) {
        uniqueInfos.set(info.object, info);
      }
    });
    return Array.from(uniqueInfos.values());
  }

  drawAndSamplePickingBuffer(_ref6) {
    let {
      layers,
      viewports,
      onViewportActive,
      deviceRect,
      redrawReason
    } = _ref6;
    (0, _assert.default)(deviceRect);
    (0, _assert.default)(Number.isFinite(deviceRect.width) && deviceRect.width > 0, '`width` must be > 0');
    (0, _assert.default)(Number.isFinite(deviceRect.height) && deviceRect.height > 0, '`height` must be > 0');
    const pickableLayers = layers.filter(layer => layer.isPickable());

    if (pickableLayers.length < 1) {
      return null;
    }

    const pickingFBO = this.pickingFBO;
    const effectProps = {
      lightSources: {}
    };
    this.pickLayersPass.render({
      layers,
      viewports,
      onViewportActive,
      pickingFBO,
      deviceRect,
      redrawReason,
      effectProps
    });
    const {
      x,
      y,
      width,
      height
    } = deviceRect;
    const pickedColors = new Uint8Array(width * height * 4);
    (0, _core.readPixelsToArray)(pickingFBO, {
      sourceX: x,
      sourceY: y,
      sourceWidth: width,
      sourceHeight: height,
      target: pickedColors
    });
    return pickedColors;
  }

  getPickingRect(_ref7) {
    let {
      deviceX,
      deviceY,
      deviceRadius,
      deviceWidth,
      deviceHeight
    } = _ref7;
    const valid = deviceX >= 0 && deviceY >= 0 && deviceX < deviceWidth && deviceY < deviceHeight;

    if (!valid) {
      return null;
    }

    const x = Math.max(0, deviceX - deviceRadius);
    const y = Math.max(0, deviceY - deviceRadius);
    const width = Math.min(deviceWidth, deviceX + deviceRadius) - x + 1;
    const height = Math.min(deviceHeight, deviceY + deviceRadius) - y + 1;
    return {
      x,
      y,
      width,
      height
    };
  }

  callLayerPickingCallbacks(infos, mode) {
    const unhandledPickInfos = [];
    const pickingEvent = this.pickingEvent;
    infos.forEach(info => {
      if (!info.layer) {
        return;
      }

      let handled = false;

      switch (mode) {
        case 'hover':
          handled = info.layer.onHover(info, pickingEvent);
          break;

        case 'query':
          break;

        default:
          throw new Error('unknown pick type');
      }

      if (!handled) {
        unhandledPickInfos.push(info);
      }
    });
    return unhandledPickInfos;
  }

}

exports.default = DeckPicker;
//# sourceMappingURL=deck-picker.js.map