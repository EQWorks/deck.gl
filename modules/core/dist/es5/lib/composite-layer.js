"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _layer = _interopRequireDefault(require("./layer"));

var _log = _interopRequireDefault(require("../utils/log"));

var _flatten = require("../utils/flatten");

class CompositeLayer extends _layer.default {
  get isComposite() {
    return true;
  }

  getSubLayers() {
    return this.internalState && this.internalState.subLayers || [];
  }

  initializeState() {}

  setState(updateObject) {
    super.setState(updateObject);
    this.setLayerNeedsUpdate();
  }

  getPickingInfo(_ref) {
    let {
      info
    } = _ref;
    return info;
  }

  renderLayers() {
    return null;
  }

  shouldRenderSubLayer(id, data) {
    const {
      _subLayerProps: overridingProps
    } = this.props;
    return data && data.length || overridingProps && overridingProps[id];
  }

  getSubLayerClass(id, DefaultLayerClass) {
    const {
      _subLayerProps: overridingProps
    } = this.props;
    return overridingProps && overridingProps[id] && overridingProps[id].type || DefaultLayerClass;
  }

  getSubLayerProps(sublayerProps) {
    const {
      opacity,
      pickable,
      visible,
      parameters,
      getPolygonOffset,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor,
      coordinateSystem,
      coordinateOrigin,
      wrapLongitude,
      positionFormat,
      modelMatrix,
      _subLayerProps: overridingProps
    } = this.props;
    const newProps = {
      opacity,
      pickable,
      visible,
      parameters,
      getPolygonOffset,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor,
      coordinateSystem,
      coordinateOrigin,
      wrapLongitude,
      positionFormat,
      modelMatrix
    };

    if (sublayerProps) {
      Object.assign(newProps, sublayerProps, overridingProps && overridingProps[sublayerProps.id], {
        id: "".concat(this.props.id, "-").concat(sublayerProps.id),
        updateTriggers: Object.assign({
          all: this.props.updateTriggers.all
        }, sublayerProps.updateTriggers)
      });
    }

    return newProps;
  }

  _getAttributeManager() {
    return null;
  }

  _renderLayers() {
    let {
      subLayers
    } = this.internalState;

    if (subLayers && !this.needsUpdate()) {
      _log.default.log(3, "Composite layer reused subLayers ".concat(this), this.internalState.subLayers)();
    } else {
      subLayers = this.renderLayers();
      subLayers = (0, _flatten.flatten)(subLayers, {
        filter: Boolean
      });
      this.internalState.subLayers = subLayers;

      _log.default.log(2, "Composite layer rendered new subLayers ".concat(this), subLayers)();
    }

    for (const layer of subLayers) {
      layer.parent = this;
    }
  }

}

exports.default = CompositeLayer;
CompositeLayer.layerName = 'CompositeLayer';
//# sourceMappingURL=composite-layer.js.map