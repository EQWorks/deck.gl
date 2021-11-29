"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _s2Utils = require("./s2-utils");

const defaultProps = Object.assign({
  getS2Token: {
    type: 'accessor',
    value: d => d.token
  }
}, _keplerOutdatedDeck2.PolygonLayer.defaultProps);

class S2Layer extends _keplerOutdatedDeck.CompositeLayer {
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
    const CellLayer = this.getSubLayerClass('cell', _keplerOutdatedDeck2.PolygonLayer);
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
      getPolygon: x => (0, _s2Utils.getS2Polygon)(getS2Token(x))
    });
  }

}

exports.default = S2Layer;
S2Layer.layerName = 'S2Layer';
S2Layer.defaultProps = defaultProps;
//# sourceMappingURL=s2-layer.js.map