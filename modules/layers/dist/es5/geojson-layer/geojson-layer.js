"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _scatterplotLayer = _interopRequireDefault(require("../scatterplot-layer/scatterplot-layer"));

var _pathLayer = _interopRequireDefault(require("../path-layer/path-layer"));

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _solidPolygonLayer = _interopRequireDefault(require("../solid-polygon-layer/solid-polygon-layer"));

var _geojson = require("./geojson");

const defaultLineColor = [0, 0, 0, 255];
const defaultFillColor = [0, 0, 0, 255];
const defaultMaterial = new _keplerOutdatedLuma.PhongMaterial();
const defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  elevationScale: 1,
  pointRadiusScale: 1,
  pointRadiusMinPixels: 0,
  pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
  lineDashJustified: false,
  fp64: false,
  getLineColor: {
    type: 'accessor',
    value: defaultLineColor
  },
  getFillColor: {
    type: 'accessor',
    value: defaultFillColor
  },
  getRadius: {
    type: 'accessor',
    value: 1
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  },
  getLineDashArray: {
    type: 'accessor',
    value: [0, 0]
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  material: defaultMaterial
};

function getCoordinates(f) {
  return f.geometry.coordinates;
}

function unwrappingAccessor(accessor) {
  if (typeof accessor !== 'function') return accessor;
  return feature => accessor((0, _geojson.unwrapSourceFeature)(feature));
}

class GeoJsonLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      features: {}
    };
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;

    if (changeFlags.dataChanged) {
      const {
        data
      } = props;
      const features = (0, _geojson.getGeojsonFeatures)(data);
      this.state.features = (0, _geojson.separateGeojsonFeatures)(features);
    }
  }

  getPickingInfo(_ref2) {
    let {
      info,
      sourceLayer
    } = _ref2;
    return Object.assign(info, {
      object: info.object ? (0, _geojson.unwrapSourceFeature)(info.object) : info.object,
      index: info.object ? (0, _geojson.unwrapSourceFeatureIndex)(info.object) : info.index
    });
  }

  renderLayers() {
    const {
      features
    } = this.state;
    const {
      pointFeatures,
      lineFeatures,
      polygonFeatures,
      polygonOutlineFeatures
    } = features;
    const {
      stroked,
      filled,
      extruded,
      wireframe,
      material,
      transitions
    } = this.props;
    const {
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      pointRadiusScale,
      pointRadiusMinPixels,
      pointRadiusMaxPixels,
      elevationScale,
      lineDashJustified,
      fp64
    } = this.props;
    const {
      getLineColor,
      getFillColor,
      getRadius,
      getLineWidth,
      getLineDashArray,
      getElevation,
      updateTriggers
    } = this.props;
    const PolygonFillLayer = this.getSubLayerClass('polygons-fill', _solidPolygonLayer.default);
    const PolygonStrokeLayer = this.getSubLayerClass('polygons-stroke', _pathLayer.default);
    const LineStringsLayer = this.getSubLayerClass('line-strings', _pathLayer.default);
    const PointsLayer = this.getSubLayerClass('points', _scatterplotLayer.default);
    const polygonFillLayer = this.shouldRenderSubLayer('polygons-fill', polygonFeatures) && new PolygonFillLayer({
      fp64,
      extruded,
      elevationScale,
      filled,
      wireframe,
      material,
      getElevation: unwrappingAccessor(getElevation),
      getFillColor: unwrappingAccessor(getFillColor),
      getLineColor: unwrappingAccessor(getLineColor),
      transitions: transitions && {
        getPolygon: transitions.geometry,
        getElevation: transitions.getElevation,
        getFillColor: transitions.getFillColor,
        getLineColor: transitions.getLineColor
      }
    }, this.getSubLayerProps({
      id: 'polygons-fill',
      updateTriggers: {
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor
      }
    }), {
      data: polygonFeatures,
      getPolygon: getCoordinates
    });
    const polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('polygons-stroke', polygonOutlineFeatures) && new PolygonStrokeLayer({
      fp64,
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      getColor: unwrappingAccessor(getLineColor),
      getWidth: unwrappingAccessor(getLineWidth),
      getDashArray: unwrappingAccessor(getLineDashArray),
      transitions: transitions && {
        getPath: transitions.geometry,
        getColor: transitions.getLineColor,
        getWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'polygons-stroke',
      updateTriggers: {
        getColor: updateTriggers.getLineColor,
        getWidth: updateTriggers.getLineWidth,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: polygonOutlineFeatures,
      getPath: getCoordinates
    });
    const pathLayer = this.shouldRenderSubLayer('linestrings', lineFeatures) && new LineStringsLayer({
      fp64,
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      getColor: unwrappingAccessor(getLineColor),
      getWidth: unwrappingAccessor(getLineWidth),
      getDashArray: unwrappingAccessor(getLineDashArray),
      transitions: transitions && {
        getPath: transitions.geometry,
        getColor: transitions.getLineColor,
        getWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'line-strings',
      updateTriggers: {
        getColor: updateTriggers.getLineColor,
        getWidth: updateTriggers.getLineWidth,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: lineFeatures,
      getPath: getCoordinates
    });
    const pointLayer = this.shouldRenderSubLayer('points', pointFeatures) && new PointsLayer({
      fp64,
      stroked,
      filled,
      radiusScale: pointRadiusScale,
      radiusMinPixels: pointRadiusMinPixels,
      radiusMaxPixels: pointRadiusMaxPixels,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      getFillColor: unwrappingAccessor(getFillColor),
      getLineColor: unwrappingAccessor(getLineColor),
      getRadius: unwrappingAccessor(getRadius),
      getLineWidth: unwrappingAccessor(getLineWidth),
      transitions: transitions && {
        getPosition: transitions.geometry,
        getFillColor: transitions.getFillColor,
        getLineColor: transitions.getLineColor,
        getRadius: transitions.getRadius,
        getLineWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'points',
      updateTriggers: {
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor,
        getRadius: updateTriggers.getRadius,
        getLineWidth: updateTriggers.getLineWidth
      }
    }), {
      data: pointFeatures,
      getPosition: getCoordinates
    });
    return [!extruded && polygonFillLayer, polygonLineLayer, pathLayer, pointLayer, extruded && polygonFillLayer];
  }

}

exports.default = GeoJsonLayer;
GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=geojson-layer.js.map