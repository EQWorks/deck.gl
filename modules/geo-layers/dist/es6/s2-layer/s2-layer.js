import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { PolygonLayer } from 'kepler-outdated-deck.gl-layers';
import { getS2Polygon } from './s2-utils';
const defaultProps = Object.assign({
  getS2Token: {
    type: 'accessor',
    value: d => d.token
  }
}, PolygonLayer.defaultProps);
export default class S2Layer extends CompositeLayer {
  renderLayers() {
    const _this$props = this.props,
          data = _this$props.data,
          getS2Token = _this$props.getS2Token;
    const _this$props2 = this.props,
          elevationScale = _this$props2.elevationScale,
          extruded = _this$props2.extruded,
          wireframe = _this$props2.wireframe,
          filled = _this$props2.filled,
          stroked = _this$props2.stroked,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          lineDashJustified = _this$props2.lineDashJustified,
          fp64 = _this$props2.fp64,
          getElevation = _this$props2.getElevation,
          getFillColor = _this$props2.getFillColor,
          getLineColor = _this$props2.getLineColor,
          getLineWidth = _this$props2.getLineWidth,
          getLineDashArray = _this$props2.getLineDashArray;
    const _this$props3 = this.props,
          updateTriggers = _this$props3.updateTriggers,
          material = _this$props3.material;
    const CellLayer = this.getSubLayerClass('cell', PolygonLayer);
    return new CellLayer({
      fp64,
      filled,
      wireframe,
      extruded,
      elevationScale,
      stroked,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      lineDashJustified,
      material,
      getElevation,
      getFillColor,
      getLineColor,
      getLineWidth,
      getLineDashArray
    }, this.getSubLayerProps({
      id: 'cell',
      updateTriggers: {
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor,
        getLineWidth: updateTriggers.getLineWidth,
        getLineDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data,
      getPolygon: x => getS2Polygon(getS2Token(x))
    });
  }

}
S2Layer.layerName = 'S2Layer';
S2Layer.defaultProps = defaultProps;
//# sourceMappingURL=s2-layer.js.map