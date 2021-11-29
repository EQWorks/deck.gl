import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer, createIterable } from 'kepler-outdated-deck.gl-core';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import PathLayer from '../path-layer/path-layer';
import * as Polygon from '../solid-polygon-layer/polygon';
var defaultLineColor = [0, 0, 0, 255];
var defaultFillColor = [0, 0, 0, 255];
var defaultMaterial = new PhongMaterial();
var defaultProps = {
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
    value: function value(f) {
      return f.polygon;
    }
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

var PolygonLayer = function (_CompositeLayer) {
  _inherits(PolygonLayer, _CompositeLayer);

  function PolygonLayer() {
    _classCallCheck(this, PolygonLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(PolygonLayer).apply(this, arguments));
  }

  _createClass(PolygonLayer, [{
    key: "initializeState",
    value: function initializeState() {
      this.state = {
        paths: []
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

      if (geometryChanged) {
        this.state.paths = this._getPaths(props);
      }
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;
      return Object.assign(info, {
        object: info.object && info.object.object || info.object
      });
    }
  }, {
    key: "_getPaths",
    value: function _getPaths(_ref3) {
      var data = _ref3.data,
          getPolygon = _ref3.getPolygon,
          positionFormat = _ref3.positionFormat;
      var paths = [];
      var positionSize = positionFormat === 'XY' ? 2 : 3;

      var _createIterable = createIterable(data),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;

          var _Polygon$normalize = Polygon.normalize(getPolygon(object, objectInfo), positionSize),
              positions = _Polygon$normalize.positions,
              holeIndices = _Polygon$normalize.holeIndices;

          if (holeIndices) {
            for (var i = 0; i <= holeIndices.length; i++) {
              var path = positions.subarray(holeIndices[i - 1] || 0, holeIndices[i] || positions.length);
              paths.push({
                path: path,
                object: object
              });
            }
          } else {
            paths.push({
              path: positions,
              object: object
            });
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return paths;
    }
  }, {
    key: "_getAccessor",
    value: function _getAccessor(accessor) {
      if (typeof accessor === 'function') {
        return function (x) {
          return accessor(x.object);
        };
      }

      return accessor;
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this$props = this.props,
          data = _this$props.data,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          elevationScale = _this$props.elevationScale,
          transitions = _this$props.transitions;
      var _this$props2 = this.props,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          lineDashJustified = _this$props2.lineDashJustified,
          fp64 = _this$props2.fp64;
      var _this$props3 = this.props,
          getFillColor = _this$props3.getFillColor,
          getLineColor = _this$props3.getLineColor,
          getLineWidth = _this$props3.getLineWidth,
          getLineDashArray = _this$props3.getLineDashArray,
          getElevation = _this$props3.getElevation,
          getPolygon = _this$props3.getPolygon,
          updateTriggers = _this$props3.updateTriggers,
          material = _this$props3.material;
      var paths = this.state.paths;
      var FillLayer = this.getSubLayerClass('fill', SolidPolygonLayer);
      var StrokeLayer = this.getSubLayerClass('stroke', PathLayer);
      var polygonLayer = this.shouldRenderSubLayer('fill', paths) && new FillLayer({
        extruded: extruded,
        elevationScale: elevationScale,
        fp64: fp64,
        filled: filled,
        wireframe: wireframe,
        getElevation: getElevation,
        getFillColor: getFillColor,
        getLineColor: getLineColor,
        material: material,
        transitions: transitions
      }, this.getSubLayerProps({
        id: 'fill',
        updateTriggers: {
          getPolygon: updateTriggers.getPolygon,
          getElevation: updateTriggers.getElevation,
          getFillColor: updateTriggers.getFillColor,
          getLineColor: updateTriggers.getLineColor
        }
      }), {
        data: data,
        getPolygon: getPolygon
      });
      var polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('stroke', paths) && new StrokeLayer({
        fp64: fp64,
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
        getPath: function getPath(x) {
          return x.path;
        }
      });
      return [!extruded && polygonLayer, polygonLineLayer, extruded && polygonLayer];
    }
  }]);

  return PolygonLayer;
}(CompositeLayer);

export { PolygonLayer as default };
PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=polygon-layer.js.map