import Layer from './layer';
import log from '../utils/log';
import { flatten } from '../utils/flatten';
export default class CompositeLayer extends Layer {
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
    let info = _ref.info;
    return info;
  }

  renderLayers() {
    return null;
  }

  shouldRenderSubLayer(id, data) {
    const overridingProps = this.props._subLayerProps;
    return data && data.length || overridingProps && overridingProps[id];
  }

  getSubLayerClass(id, DefaultLayerClass) {
    const overridingProps = this.props._subLayerProps;
    return overridingProps && overridingProps[id] && overridingProps[id].type || DefaultLayerClass;
  }

  getSubLayerProps(sublayerProps) {
    const _this$props = this.props,
          opacity = _this$props.opacity,
          pickable = _this$props.pickable,
          visible = _this$props.visible,
          parameters = _this$props.parameters,
          getPolygonOffset = _this$props.getPolygonOffset,
          highlightedObjectIndex = _this$props.highlightedObjectIndex,
          autoHighlight = _this$props.autoHighlight,
          highlightColor = _this$props.highlightColor,
          coordinateSystem = _this$props.coordinateSystem,
          coordinateOrigin = _this$props.coordinateOrigin,
          wrapLongitude = _this$props.wrapLongitude,
          positionFormat = _this$props.positionFormat,
          modelMatrix = _this$props.modelMatrix,
          overridingProps = _this$props._subLayerProps;
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
        id: `${this.props.id}-${sublayerProps.id}`,
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
    let subLayers = this.internalState.subLayers;

    if (subLayers && !this.needsUpdate()) {
      log.log(3, `Composite layer reused subLayers ${this}`, this.internalState.subLayers)();
    } else {
      subLayers = this.renderLayers();
      subLayers = flatten(subLayers, {
        filter: Boolean
      });
      this.internalState.subLayers = subLayers;
      log.log(2, `Composite layer rendered new subLayers ${this}`, subLayers)();
    }

    for (const layer of subLayers) {
      layer.parent = this;
    }
  }

}
CompositeLayer.layerName = 'CompositeLayer';
//# sourceMappingURL=composite-layer.js.map