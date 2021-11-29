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
    const {
      data,
      getS2Token
    } = this.props;
    const {
      elevationScale,
      extruded,
      wireframe,
      filled,
      stroked,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      lineDashJustified,
      fp64,
      getElevation,
      getFillColor,
      getLineColor,
      getLineWidth,
      getLineDashArray
    } = this.props;
    const {
      updateTriggers,
      material
    } = this.props;
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