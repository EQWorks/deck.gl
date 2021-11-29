"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _h3Js = require("h3-js");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var UPDATE_THRESHOLD_KM = 10;

function getHexagonCentroid(getHexagon, object, objectInfo) {
  var hexagonId = getHexagon(object, objectInfo);

  var _h3ToGeo = (0, _h3Js.h3ToGeo)(hexagonId),
      _h3ToGeo2 = (0, _slicedToArray2.default)(_h3ToGeo, 2),
      lat = _h3ToGeo2[0],
      lng = _h3ToGeo2[1];

  return [lng, lat];
}

function h3ToPolygon(hexId) {
  var vertices = (0, _h3Js.h3ToGeoBoundary)(hexId, true);
  var refLng = vertices[0][0];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = vertices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pt = _step.value;
      var deltaLng = pt[0] - refLng;

      if (deltaLng > 180) {
        pt[0] -= 360;
      } else if (deltaLng < -180) {
        pt[0] += 360;
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

  return vertices;
}

var defaultProps = Object.assign({}, _keplerOutdatedDeck2.PolygonLayer.defaultProps, {
  highPrecision: false,
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  getHexagon: {
    type: 'accessor',
    value: function value(x) {
      return x.hexagon;
    }
  },
  extruded: true,
  getColor: null
});

var H3HexagonLayer = function (_CompositeLayer) {
  (0, _inherits2.default)(H3HexagonLayer, _CompositeLayer);

  function H3HexagonLayer() {
    (0, _classCallCheck2.default)(this, H3HexagonLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(H3HexagonLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(H3HexagonLayer, [{
    key: "shouldUpdateState",
    value: function shouldUpdateState(_ref) {
      var changeFlags = _ref.changeFlags;
      return this._shouldUseHighPrecision() ? changeFlags.propsOrDataChanged : changeFlags.somethingChanged;
    }
  }, {
    key: "updateState",
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagon) {
        var resolution = -1;
        var hasPentagon = false;

        var _createIterable = (0, _keplerOutdatedDeck.createIterable)(props.data),
            iterable = _createIterable.iterable,
            objectInfo = _createIterable.objectInfo;

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = iterable[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var object = _step2.value;
            objectInfo.index++;
            var hexId = props.getHexagon(object, objectInfo);
            resolution = resolution < 0 ? (0, _h3Js.h3GetResolution)(hexId) : resolution;

            if ((0, _h3Js.h3IsPentagon)(hexId)) {
              hasPentagon = true;
              break;
            }
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

        this.setState({
          resolution: resolution,
          edgeLengthKM: resolution >= 0 ? (0, _h3Js.edgeLength)(resolution, _h3Js.UNITS.km) : 0,
          hasPentagon: hasPentagon,
          vertices: null
        });
      }

      this._updateVertices(this.context.viewport);
    }
  }, {
    key: "_shouldUseHighPrecision",
    value: function _shouldUseHighPrecision() {
      var _this$state = this.state,
          resolution = _this$state.resolution,
          hasPentagon = _this$state.hasPentagon;
      return this.props.highPrecision || hasPentagon || resolution >= 0 && resolution <= 5;
    }
  }, {
    key: "_updateVertices",
    value: function _updateVertices(viewport) {
      if (this._shouldUseHighPrecision()) {
        return;
      }

      var _this$state2 = this.state,
          resolution = _this$state2.resolution,
          edgeLengthKM = _this$state2.edgeLengthKM,
          centerHex = _this$state2.centerHex;

      if (resolution < 0) {
        return;
      }

      var hex = (0, _h3Js.geoToH3)(viewport.latitude, viewport.longitude, resolution);

      if (centerHex === hex || centerHex && (0, _h3Js.h3Distance)(centerHex, hex) * edgeLengthKM < UPDATE_THRESHOLD_KM) {
        return;
      }

      var pixelsPerMeter = viewport.distanceScales.pixelsPerMeter;
      var vertices = h3ToPolygon(hex);

      var _h3ToGeo3 = (0, _h3Js.h3ToGeo)(hex),
          _h3ToGeo4 = (0, _slicedToArray2.default)(_h3ToGeo3, 2),
          centerLat = _h3ToGeo4[0],
          centerLng = _h3ToGeo4[1];

      var _viewport$projectFlat = viewport.projectFlat([centerLng, centerLat]),
          _viewport$projectFlat2 = (0, _slicedToArray2.default)(_viewport$projectFlat, 2),
          centerX = _viewport$projectFlat2[0],
          centerY = _viewport$projectFlat2[1];

      vertices = vertices.map(function (p) {
        var worldPosition = viewport.projectFlat(p);
        worldPosition[0] = (worldPosition[0] - centerX) / pixelsPerMeter[0];
        worldPosition[1] = (worldPosition[1] - centerY) / pixelsPerMeter[1];
        return worldPosition;
      });
      this.setState({
        centerHex: hex,
        vertices: vertices
      });
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      return this._shouldUseHighPrecision() ? this._renderPolygonLayer() : this._renderColumnLayer();
    }
  }, {
    key: "_getForwardProps",
    value: function _getForwardProps() {
      var _this$props = this.props,
          elevationScale = _this$props.elevationScale,
          fp64 = _this$props.fp64,
          material = _this$props.material,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          lineWidthUnits = _this$props.lineWidthUnits,
          lineWidthScale = _this$props.lineWidthScale,
          lineWidthMinPixels = _this$props.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props.lineWidthMaxPixels,
          getColor = _this$props.getColor,
          getFillColor = _this$props.getFillColor,
          getElevation = _this$props.getElevation,
          getLineColor = _this$props.getLineColor,
          getLineWidth = _this$props.getLineWidth,
          updateTriggers = _this$props.updateTriggers;
      return {
        elevationScale: elevationScale,
        fp64: fp64,
        extruded: extruded,
        wireframe: wireframe,
        stroked: stroked,
        filled: filled,
        lineWidthUnits: lineWidthUnits,
        lineWidthScale: lineWidthScale,
        lineWidthMinPixels: lineWidthMinPixels,
        lineWidthMaxPixels: lineWidthMaxPixels,
        material: material,
        getElevation: getElevation,
        getFillColor: getColor || getFillColor,
        getLineColor: getLineColor,
        getLineWidth: getLineWidth,
        updateTriggers: {
          getFillColor: updateTriggers.getColor || updateTriggers.getFillColor,
          getElevation: updateTriggers.getElevation,
          getLineColor: updateTriggers.getLineColor,
          getLineWidth: updateTriggers.getLineWidth
        }
      };
    }
  }, {
    key: "_renderPolygonLayer",
    value: function _renderPolygonLayer() {
      var _this$props2 = this.props,
          data = _this$props2.data,
          getHexagon = _this$props2.getHexagon,
          updateTriggers = _this$props2.updateTriggers;
      var SubLayerClass = this.getSubLayerClass('hexagon-cell-hifi', _keplerOutdatedDeck2.PolygonLayer);

      var forwardProps = this._getForwardProps();

      forwardProps.updateTriggers.getPolygon = updateTriggers.getHexagon;
      return new SubLayerClass(forwardProps, this.getSubLayerProps({
        id: 'hexagon-cell-hifi',
        updateTriggers: forwardProps.updateTriggers
      }), {
        data: data,
        getPolygon: function getPolygon(object, objectInfo) {
          var hexagonId = getHexagon(object, objectInfo);
          return h3ToPolygon(hexagonId);
        }
      });
    }
  }, {
    key: "_renderColumnLayer",
    value: function _renderColumnLayer() {
      var _this$props3 = this.props,
          data = _this$props3.data,
          getHexagon = _this$props3.getHexagon,
          updateTriggers = _this$props3.updateTriggers;
      var SubLayerClass = this.getSubLayerClass('hexagon-cell', _keplerOutdatedDeck2.ColumnLayer);

      var forwardProps = this._getForwardProps();

      forwardProps.updateTriggers.getPosition = updateTriggers.getHexagon;
      return new SubLayerClass(forwardProps, this.getSubLayerProps({
        id: 'hexagon-cell',
        updateTriggers: forwardProps.updateTriggers
      }), {
        data: data,
        diskResolution: 6,
        radius: 1,
        vertices: this.state.vertices,
        getPosition: getHexagonCentroid.bind(null, getHexagon)
      });
    }
  }]);
  return H3HexagonLayer;
}(_keplerOutdatedDeck.CompositeLayer);

exports.default = H3HexagonLayer;
H3HexagonLayer.defaultProps = defaultProps;
H3HexagonLayer.layerName = 'H3HexagonLayer';
//# sourceMappingURL=h3-hexagon-layer.js.map