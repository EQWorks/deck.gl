import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { h3SetToMultiPolygon } from 'h3-js';
import { CompositeLayer, createIterable } from 'kepler-outdated-deck.gl-core';
import { PolygonLayer } from 'kepler-outdated-deck.gl-layers';
var defaultProps = Object.assign({
  getHexagons: {
    type: 'accessor',
    value: function value(d) {
      return d.hexagons;
    }
  }
}, PolygonLayer.defaultProps);

var H3ClusterLayer = function (_CompositeLayer) {
  _inherits(H3ClusterLayer, _CompositeLayer);

  function H3ClusterLayer() {
    _classCallCheck(this, H3ClusterLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(H3ClusterLayer).apply(this, arguments));
  }

  _createClass(H3ClusterLayer, [{
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagons) {
        var data = props.data,
            getHexagons = props.getHexagons;
        var polygons = [];

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
            var hexagons = getHexagons(object, objectInfo);
            var multiPolygon = h3SetToMultiPolygon(hexagons, true);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = multiPolygon[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var polygon = _step2.value;
                polygons.push({
                  polygon: polygon,
                  _obj: object,
                  _idx: objectInfo.index
                });
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
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

        this.setState({
          polygons: polygons
        });
      }
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;
      return Object.assign(info, {
        object: info.object && info.object._obj,
        index: info.object && info.object._idx
      });
    }
  }, {
    key: "getSubLayerAccessor",
    value: function getSubLayerAccessor(accessor) {
      if (typeof accessor !== 'function') return accessor;
      return function (object, objectInfo) {
        return accessor(object._obj, objectInfo);
      };
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this$props = this.props,
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
      var SubLayerClass = this.getSubLayerClass('cluster-region', PolygonLayer);
      return new SubLayerClass({
        fp64: fp64,
        filled: filled,
        wireframe: wireframe,
        extruded: extruded,
        elevationScale: elevationScale,
        stroked: stroked,
        lineWidthScale: lineWidthScale,
        lineWidthMinPixels: lineWidthMinPixels,
        lineWidthMaxPixels: lineWidthMaxPixels,
        lineJointRounded: lineJointRounded,
        lineMiterLimit: lineMiterLimit,
        lineDashJustified: lineDashJustified,
        material: material,
        getFillColor: this.getSubLayerAccessor(getFillColor),
        getLineColor: this.getSubLayerAccessor(getLineColor),
        getLineWidth: this.getSubLayerAccessor(getLineWidth),
        getLineDashArray: this.getSubLayerAccessor(getLineDashArray),
        getElevation: this.getSubLayerAccessor(getElevation)
      }, this.getSubLayerProps({
        id: 'cluster-region',
        updateTriggers: updateTriggers
      }), {
        data: this.state.polygons,
        getPolygon: function getPolygon(d) {
          return d.polygon;
        }
      });
    }
  }]);

  return H3ClusterLayer;
}(CompositeLayer);

export { H3ClusterLayer as default };
H3ClusterLayer.defaultProps = defaultProps;
H3ClusterLayer.layerName = 'H3ClusterLayer';
//# sourceMappingURL=h3-cluster-layer.js.map