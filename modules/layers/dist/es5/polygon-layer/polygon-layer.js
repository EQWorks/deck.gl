"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _solidPolygonLayer = _interopRequireDefault(require("../solid-polygon-layer/solid-polygon-layer"));

var _pathLayer = _interopRequireDefault(require("../path-layer/path-layer"));

var Polygon = _interopRequireWildcard(require("../solid-polygon-layer/polygon"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const defaultLineColor = [0, 0, 0, 255];
const defaultFillColor = [0, 0, 0, 255];
const defaultMaterial = new _core.PhongMaterial();
const defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  elevationScale: 1,
  wireframe: false,
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  lineDashJustified: false,
  fp64: false,
  getPolygon: {
    type: 'accessor',
    value: f => f.polygon
  },
  getFillColor: {
    type: 'accessor',
    value: defaultFillColor
  },
  getLineColor: {
    type: 'accessor',
    value: defaultLineColor
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

class PolygonLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      paths: []
    };
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    const geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

    if (geometryChanged) {
      this.state.paths = this._getPaths(props);
    }
  }

  getPickingInfo(_ref2) {
    let {
      info
    } = _ref2;
    return Object.assign(info, {
      object: info.object && info.object.object || info.object
    });
  }

  _getPaths(_ref3) {
    let {
      data,
      getPolygon,
      positionFormat
    } = _ref3;
    const paths = [];
    const positionSize = positionFormat === 'XY' ? 2 : 3;
    const {
      iterable,
      objectInfo
    } = (0, _keplerOutdatedDeck.createIterable)(data);

    for (const object of iterable) {
      objectInfo.index++;
      const {
        positions,
        holeIndices
      } = Polygon.normalize(getPolygon(object, objectInfo), positionSize);

      if (holeIndices) {
        for (let i = 0; i <= holeIndices.length; i++) {
          const path = positions.subarray(holeIndices[i - 1] || 0, holeIndices[i] || positions.length);
          paths.push({
            path,
            object
          });
        }
      } else {
        paths.push({
          path: positions,
          object
        });
      }
    }

    return paths;
  }

  _getAccessor(accessor) {
    if (typeof accessor === 'function') {
      return x => accessor(x.object);
    }

    return accessor;
  }

  renderLayers() {
    const {
      data,
      stroked,
      filled,
      extruded,
      wireframe,
      elevationScale,
      transitions
    } = this.props;
    const {
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      lineJointRounded,
      lineMiterLimit,
      lineDashJustified,
      fp64
    } = this.props;
    const {
      getFillColor,
      getLineColor,
      getLineWidth,
      getLineDashArray,
      getElevation,
      getPolygon,
      updateTriggers,
      material
    } = this.props;
    const {
      paths
    } = this.state;
    const FillLayer = this.getSubLayerClass('fill', _solidPolygonLayer.default);
    const StrokeLayer = this.getSubLayerClass('stroke', _pathLayer.default);
    const polygonLayer = this.shouldRenderSubLayer('fill', paths) && new FillLayer({
      extruded,
      elevationScale,
      fp64,
      filled,
      wireframe,
      getElevation,
      getFillColor,
      getLineColor,
      material,
      transitions
    }, this.getSubLayerProps({
      id: 'fill',
      updateTriggers: {
        getPolygon: updateTriggers.getPolygon,
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor
      }
    }), {
      data,
      getPolygon
    });
    const polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('stroke', paths) && new StrokeLayer({
      fp64,
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      transitions: transitions && {
        getWidth: transitions.getLineWidth,
        getColor: transitions.getLineColor,
        getPath: transitions.getPolygon
      },
      getColor: this._getAccessor(getLineColor),
      getWidth: this._getAccessor(getLineWidth),
      getDashArray: this._getAccessor(getLineDashArray)
    }, this.getSubLayerProps({
      id: 'stroke',
      updateTriggers: {
        getWidth: updateTriggers.getLineWidth,
        getColor: updateTriggers.getLineColor,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: paths,
      getPath: x => x.path
    });
    return [!extruded && polygonLayer, polygonLineLayer, extruded && polygonLayer];
  }

}

exports.default = PolygonLayer;
PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=polygon-layer.js.map