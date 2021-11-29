"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _h3Js = require("h3-js");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

const UPDATE_THRESHOLD_KM = 10;

function getHexagonCentroid(getHexagon, object, objectInfo) {
  const hexagonId = getHexagon(object, objectInfo);
  const [lat, lng] = (0, _h3Js.h3ToGeo)(hexagonId);
  return [lng, lat];
}

function h3ToPolygon(hexId) {
  const vertices = (0, _h3Js.h3ToGeoBoundary)(hexId, true);
  const refLng = vertices[0][0];

  for (const pt of vertices) {
    const deltaLng = pt[0] - refLng;

    if (deltaLng > 180) {
      pt[0] -= 360;
    } else if (deltaLng < -180) {
      pt[0] += 360;
    }
  }

  return vertices;
}

const defaultProps = Object.assign({}, _keplerOutdatedDeck2.PolygonLayer.defaultProps, {
  highPrecision: false,
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  getHexagon: {
    type: 'accessor',
    value: x => x.hexagon
  },
  extruded: true,
  getColor: null
});

class H3HexagonLayer extends _keplerOutdatedDeck.CompositeLayer {
  shouldUpdateState(_ref) {
    let {
      changeFlags
    } = _ref;
    return this._shouldUseHighPrecision() ? changeFlags.propsOrDataChanged : changeFlags.somethingChanged;
  }

  updateState(_ref2) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref2;

    if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagon) {
      let resolution = -1;
      let hasPentagon = false;
      const {
        iterable,
        objectInfo
      } = (0, _keplerOutdatedDeck.createIterable)(props.data);

      for (const object of iterable) {
        objectInfo.index++;
        const hexId = props.getHexagon(object, objectInfo);
        resolution = resolution < 0 ? (0, _h3Js.h3GetResolution)(hexId) : resolution;

        if ((0, _h3Js.h3IsPentagon)(hexId)) {
          hasPentagon = true;
          break;
        }
      }

      this.setState({
        resolution,
        edgeLengthKM: resolution >= 0 ? (0, _h3Js.edgeLength)(resolution, _h3Js.UNITS.km) : 0,
        hasPentagon,
        vertices: null
      });
    }

    this._updateVertices(this.context.viewport);
  }

  _shouldUseHighPrecision() {
    const {
      resolution,
      hasPentagon
    } = this.state;
    return this.props.highPrecision || hasPentagon || resolution >= 0 && resolution <= 5;
  }

  _updateVertices(viewport) {
    if (this._shouldUseHighPrecision()) {
      return;
    }

    const {
      resolution,
      edgeLengthKM,
      centerHex
    } = this.state;

    if (resolution < 0) {
      return;
    }

    const hex = (0, _h3Js.geoToH3)(viewport.latitude, viewport.longitude, resolution);

    if (centerHex === hex || centerHex && (0, _h3Js.h3Distance)(centerHex, hex) * edgeLengthKM < UPDATE_THRESHOLD_KM) {
      return;
    }

    const {
      pixelsPerMeter
    } = viewport.distanceScales;
    let vertices = h3ToPolygon(hex);
    const [centerLat, centerLng] = (0, _h3Js.h3ToGeo)(hex);
    const [centerX, centerY] = viewport.projectFlat([centerLng, centerLat]);
    vertices = vertices.map(p => {
      const worldPosition = viewport.projectFlat(p);
      worldPosition[0] = (worldPosition[0] - centerX) / pixelsPerMeter[0];
      worldPosition[1] = (worldPosition[1] - centerY) / pixelsPerMeter[1];
      return worldPosition;
    });
    this.setState({
      centerHex: hex,
      vertices
    });
  }

  renderLayers() {
    return this._shouldUseHighPrecision() ? this._renderPolygonLayer() : this._renderColumnLayer();
  }

  _getForwardProps() {
    const {
      elevationScale,
      fp64,
      material,
      extruded,
      wireframe,
      stroked,
      filled,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      getColor,
      getFillColor,
      getElevation,
      getLineColor,
      getLineWidth,
      updateTriggers
    } = this.props;
    return {
      elevationScale,
      fp64,
      extruded,
      wireframe,
      stroked,
      filled,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      material,
      getElevation,
      getFillColor: getColor || getFillColor,
      getLineColor,
      getLineWidth,
      updateTriggers: {
        getFillColor: updateTriggers.getColor || updateTriggers.getFillColor,
        getElevation: updateTriggers.getElevation,
        getLineColor: updateTriggers.getLineColor,
        getLineWidth: updateTriggers.getLineWidth
      }
    };
  }

  _renderPolygonLayer() {
    const {
      data,
      getHexagon,
      updateTriggers
    } = this.props;
    const SubLayerClass = this.getSubLayerClass('hexagon-cell-hifi', _keplerOutdatedDeck2.PolygonLayer);

    const forwardProps = this._getForwardProps();

    forwardProps.updateTriggers.getPolygon = updateTriggers.getHexagon;
    return new SubLayerClass(forwardProps, this.getSubLayerProps({
      id: 'hexagon-cell-hifi',
      updateTriggers: forwardProps.updateTriggers
    }), {
      data,
      getPolygon: (object, objectInfo) => {
        const hexagonId = getHexagon(object, objectInfo);
        return h3ToPolygon(hexagonId);
      }
    });
  }

  _renderColumnLayer() {
    const {
      data,
      getHexagon,
      updateTriggers
    } = this.props;
    const SubLayerClass = this.getSubLayerClass('hexagon-cell', _keplerOutdatedDeck2.ColumnLayer);

    const forwardProps = this._getForwardProps();

    forwardProps.updateTriggers.getPosition = updateTriggers.getHexagon;
    return new SubLayerClass(forwardProps, this.getSubLayerProps({
      id: 'hexagon-cell',
      updateTriggers: forwardProps.updateTriggers
    }), {
      data,
      diskResolution: 6,
      radius: 1,
      vertices: this.state.vertices,
      getPosition: getHexagonCentroid.bind(null, getHexagon)
    });
  }

}

exports.default = H3HexagonLayer;
H3HexagonLayer.defaultProps = defaultProps;
H3HexagonLayer.layerName = 'H3HexagonLayer';
//# sourceMappingURL=h3-hexagon-layer.js.map