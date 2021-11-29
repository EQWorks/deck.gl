import { h3SetToMultiPolygon } from 'h3-js';
import { CompositeLayer, createIterable } from 'kepler-outdated-deck.gl-core';
import { PolygonLayer } from 'kepler-outdated-deck.gl-layers';
const defaultProps = Object.assign({
  getHexagons: {
    type: 'accessor',
    value: d => d.hexagons
  }
}, PolygonLayer.defaultProps);
export default class H3ClusterLayer extends CompositeLayer {
  updateState(_ref) {
    let props = _ref.props,
        oldProps = _ref.oldProps,
        changeFlags = _ref.changeFlags;

    if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagons) {
      const data = props.data,
            getHexagons = props.getHexagons;
      const polygons = [];

      const _createIterable = createIterable(data),
            iterable = _createIterable.iterable,
            objectInfo = _createIterable.objectInfo;

      for (const object of iterable) {
        objectInfo.index++;
        const hexagons = getHexagons(object, objectInfo);
        const multiPolygon = h3SetToMultiPolygon(hexagons, true);

        for (const polygon of multiPolygon) {
          polygons.push({
            polygon,
            _obj: object,
            _idx: objectInfo.index
          });
        }
      }

      this.setState({
        polygons
      });
    }
  }

  getPickingInfo(_ref2) {
    let info = _ref2.info;
    return Object.assign(info, {
      object: info.object && info.object._obj,
      index: info.object && info.object._idx
    });
  }

  getSubLayerAccessor(accessor) {
    if (typeof accessor !== 'function') return accessor;
    return (object, objectInfo) => {
      return accessor(object._obj, objectInfo);
    };
  }

  renderLayers() {
    const _this$props = this.props,
          elevationScale = _this$props.elevationScale,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          filled = _this$props.filled,
          stroked = _this$props.stroked,
          lineWidthScale = _this$props.lineWidthScale,
          lineWidthMinPixels = _this$props.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props.lineWidthMaxPixels,
          lineJointRounded = _this$props.lineJointRounded,
          lineMiterLimit = _this$props.lineMiterLimit,
          lineDashJustified = _this$props.lineDashJustified,
          fp64 = _this$props.fp64,
          material = _this$props.material,
          getFillColor = _this$props.getFillColor,
          getLineColor = _this$props.getLineColor,
          getLineWidth = _this$props.getLineWidth,
          getLineDashArray = _this$props.getLineDashArray,
          getElevation = _this$props.getElevation,
          updateTriggers = _this$props.updateTriggers;
    const SubLayerClass = this.getSubLayerClass('cluster-region', PolygonLayer);
    return new SubLayerClass({
      fp64,
      filled,
      wireframe,
      extruded,
      elevationScale,
      stroked,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      lineDashJustified,
      material,
      getFillColor: this.getSubLayerAccessor(getFillColor),
      getLineColor: this.getSubLayerAccessor(getLineColor),
      getLineWidth: this.getSubLayerAccessor(getLineWidth),
      getLineDashArray: this.getSubLayerAccessor(getLineDashArray),
      getElevation: this.getSubLayerAccessor(getElevation)
    }, this.getSubLayerProps({
      id: 'cluster-region',
      updateTriggers
    }), {
      data: this.state.polygons,
      getPolygon: d => d.polygon
    });
  }

}
H3ClusterLayer.defaultProps = defaultProps;
H3ClusterLayer.layerName = 'H3ClusterLayer';
//# sourceMappingURL=h3-cluster-layer.js.map