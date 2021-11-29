"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _h3Js = require("h3-js");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

const defaultProps = Object.assign({
  getHexagons: {
    type: 'accessor',
    value: d => d.hexagons
  }
}, _keplerOutdatedDeck2.PolygonLayer.defaultProps);

class H3ClusterLayer extends _keplerOutdatedDeck.CompositeLayer {
  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;

    if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagons) {
      const {
        data,
        getHexagons
      } = props;
      const polygons = [];
      const {
        iterable,
        objectInfo
      } = (0, _keplerOutdatedDeck.createIterable)(data);

      for (const object of iterable) {
        objectInfo.index++;
        const hexagons = getHexagons(object, objectInfo);
        const multiPolygon = (0, _h3Js.h3SetToMultiPolygon)(hexagons, true);

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
    let {
      info
    } = _ref2;
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
    const {
      elevationScale,
      extruded,
      wireframe,
      filled,
      stroked,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      lineDashJustified,
      fp64,
      material,
      getFillColor,
      getLineColor,
      getLineWidth,
      getLineDashArray,
      getElevation,
      updateTriggers
    } = this.props;
    const SubLayerClass = this.getSubLayerClass('cluster-region', _keplerOutdatedDeck2.PolygonLayer);
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

exports.default = H3ClusterLayer;
H3ClusterLayer.defaultProps = defaultProps;
H3ClusterLayer.layerName = 'H3ClusterLayer';
//# sourceMappingURL=h3-cluster-layer.js.map