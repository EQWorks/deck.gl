"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLayerPickingInfo = getLayerPickingInfo;
exports.processPickInfo = processPickInfo;

function processPickInfo(_ref) {
  let {
    pickInfo,
    lastPickedInfo,
    mode,
    layers,
    viewports,
    x,
    y,
    deviceX,
    deviceY,
    pixelRatio
  } = _ref;
  const {
    pickedColor,
    pickedLayer,
    pickedObjectIndex
  } = pickInfo;
  const affectedLayers = pickedLayer ? [pickedLayer] : [];

  if (mode === 'hover') {
    const lastPickedObjectIndex = lastPickedInfo.index;
    const lastPickedLayerId = lastPickedInfo.layerId;
    const pickedLayerId = pickedLayer && pickedLayer.props.id;

    if (pickedLayerId !== lastPickedLayerId || pickedObjectIndex !== lastPickedObjectIndex) {
      if (pickedLayerId !== lastPickedLayerId) {
        const lastPickedLayer = layers.find(layer => layer.props.id === lastPickedLayerId);

        if (lastPickedLayer) {
          affectedLayers.unshift(lastPickedLayer);
        }
      }

      lastPickedInfo.layerId = pickedLayerId;
      lastPickedInfo.index = pickedObjectIndex;
      lastPickedInfo.info = null;
    }
  }

  const viewport = getViewportFromCoordinates({
    viewports
  });
  const coordinate = viewport && viewport.unproject([x, y]);
  const baseInfo = {
    color: null,
    layer: null,
    index: -1,
    picked: false,
    x,
    y,
    pixel: [x, y],
    coordinate,
    lngLat: coordinate,
    devicePixel: [deviceX, deviceY],
    pixelRatio
  };
  const infos = new Map();
  infos.set(null, baseInfo);
  affectedLayers.forEach(layer => {
    let info = Object.assign({}, baseInfo);

    if (layer === pickedLayer) {
      info.color = pickedColor;
      info.index = pickedObjectIndex;
      info.picked = true;
    }

    info = getLayerPickingInfo({
      layer,
      info,
      mode
    });

    if (layer === pickedLayer && mode === 'hover') {
      lastPickedInfo.info = info;
    }

    if (info) {
      infos.set(info.layer.id, info);
    }

    if (mode === 'hover') {
      const pickingSelectedColor = layer.props.autoHighlight && pickedLayer === layer ? pickedColor : null;
      layer.setModuleParameters({
        pickingSelectedColor
      });
      layer.setNeedsRedraw();
    }
  });
  return infos;
}

function getLayerPickingInfo(_ref2) {
  let {
    layer,
    info,
    mode
  } = _ref2;

  while (layer && info) {
    const sourceLayer = info.layer || layer;
    info.layer = layer;
    info = layer.pickLayer({
      info,
      mode,
      sourceLayer
    });
    layer = layer.parent;
  }

  return info;
}

function getViewportFromCoordinates(_ref3) {
  let {
    viewports
  } = _ref3;
  const viewport = viewports[0];
  return viewport;
}
//# sourceMappingURL=pick-info.js.map