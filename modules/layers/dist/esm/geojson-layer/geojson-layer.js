import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import ScatterplotLayer from '../scatterplot-layer/scatterplot-layer';
import PathLayer from '../path-layer/path-layer';
import { PhongMaterial } from '@luma.gl/core';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import { getGeojsonFeatures, separateGeojsonFeatures, unwrapSourceFeature, unwrapSourceFeatureIndex } from './geojson';
var defaultLineColor = [0, 0, 0, 255];
var defaultFillColor = [0, 0, 0, 255];
var defaultMaterial = new PhongMaterial();
var defaultProps = {
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
  return function (feature) {
    return accessor(unwrapSourceFeature(feature));
  };
}

var GeoJsonLayer = function (_CompositeLayer) {
  _inherits(GeoJsonLayer, _CompositeLayer);

  function GeoJsonLayer() {
    _classCallCheck(this, GeoJsonLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoJsonLayer).apply(this, arguments));
  }

  _createClass(GeoJsonLayer, [{
    key: "initializeState",
    value: function initializeState() {
      this.state = {
        features: {}
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var data = props.data;
        var features = getGeojsonFeatures(data);
        this.state.features = separateGeojsonFeatures(features);
      }
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info,
          sourceLayer = _ref2.sourceLayer;
      return Object.assign(info, {
        object: info.object ? unwrapSourceFeature(info.object) : info.object,
        index: info.object ? unwrapSourceFeatureIndex(info.object) : info.index
      });
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var features = this.state.features;
      var pointFeatures = features.pointFeatures,
          lineFeatures = features.lineFeatures,
          polygonFeatures = features.polygonFeatures,
          polygonOutlineFeatures = features.polygonOutlineFeatures;
      var _this$props = this.props,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          material = _this$props.material,
          transitions = _this$props.transitions;
      var _this$props2 = this.props,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          pointRadiusScale = _this$props2.pointRadiusScale,
          pointRadiusMinPixels = _this$props2.pointRadiusMinPixels,
          pointRadiusMaxPixels = _this$props2.pointRadiusMaxPixels,
          elevationScale = _this$props2.elevationScale,
          lineDashJustified = _this$props2.lineDashJustified,
          fp64 = _this$props2.fp64;
      var _this$props3 = this.props,
          getLineColor = _this$props3.getLineColor,
          getFillColor = _this$props3.getFillColor,
          getRadius = _this$props3.getRadius,
          getLineWidth = _this$props3.getLineWidth,
          getLineDashArray = _this$props3.getLineDashArray,
          getElevation = _this$props3.getElevation,
          updateTriggers = _this$props3.updateTriggers;
      var PolygonFillLayer = this.getSubLayerClass('polygons-fill', SolidPolygonLayer);
      var PolygonStrokeLayer = this.getSubLayerClass('polygons-stroke', PathLayer);
      var LineStringsLayer = this.getSubLayerClass('line-strings', PathLayer);
      var PointsLayer = this.getSubLayerClass('points', ScatterplotLayer);
      var polygonFillLayer = this.shouldRenderSubLayer('polygons-fill', polygonFeatures) && new PolygonFillLayer({
        fp64: fp64,
        extruded: extruded,
        elevationScale: elevationScale,
        filled: filled,
        wireframe: wireframe,
        material: material,
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
      var polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('polygons-stroke', polygonOutlineFeatures) && new PolygonStrokeLayer({
        fp64: fp64,
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
      var pathLayer = this.shouldRenderSubLayer('linestrings', lineFeatures) && new LineStringsLayer({
        fp64: fp64,
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
      var pointLayer = this.shouldRenderSubLayer('points', pointFeatures) && new PointsLayer({
        fp64: fp64,
        stroked: stroked,
        filled: filled,
        radiusScale: pointRadiusScale,
        radiusMinPixels: pointRadiusMinPixels,
        radiusMaxPixels: pointRadiusMaxPixels,
        lineWidthUnits: lineWidthUnits,
        lineWidthScale: lineWidthScale,
        lineWidthMinPixels: lineWidthMinPixels,
        lineWidthMaxPixels: lineWidthMaxPixels,
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
  }]);

  return GeoJsonLayer;
}(CompositeLayer);

export { GeoJsonLayer as default };
GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=geojson-layer.js.map