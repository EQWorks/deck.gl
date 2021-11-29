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

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _s2Utils = require("./s2-utils");

var defaultProps = Object.assign({
  getS2Token: {
    type: 'accessor',
    value: function value(d) {
      return d.token;
    }
  }
}, _keplerOutdatedDeck2.PolygonLayer.defaultProps);

var S2Layer = function (_CompositeLayer) {
  (0, _inherits2.default)(S2Layer, _CompositeLayer);

  function S2Layer() {
    (0, _classCallCheck2.default)(this, S2Layer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(S2Layer).apply(this, arguments));
  }

  (0, _createClass2.default)(S2Layer, [{
    key: "renderLayers",
    value: function renderLayers() {
      var _this$props = this.props,
          data = _this$props.data,
          getS2Token = _this$props.getS2Token;
      var _this$props2 = this.props,
          elevationScale = _this$props2.elevationScale,
          extruded = _this$props2.extruded,
          wireframe = _this$props2.wireframe,
          filled = _this$props2.filled,
          stroked = _this$props2.stroked,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          lineDashJustified = _this$props2.lineDashJustified,
          fp64 = _this$props2.fp64,
          getElevation = _this$props2.getElevation,
          getFillColor = _this$props2.getFillColor,
          getLineColor = _this$props2.getLineColor,
          getLineWidth = _this$props2.getLineWidth,
          getLineDashArray = _this$props2.getLineDashArray;
      var _this$props3 = this.props,
          updateTriggers = _this$props3.updateTriggers,
          material = _this$props3.material;
      var CellLayer = this.getSubLayerClass('cell', _keplerOutdatedDeck2.PolygonLayer);
      return new CellLayer({
        fp64: fp64,
        filled: filled,
        wireframe: wireframe,
        extruded: extruded,
        elevationScale: elevationScale,
        stroked: stroked,
        lineWidthUnits: lineWidthUnits,
        lineWidthScale: lineWidthScale,
        lineWidthMinPixels: lineWidthMinPixels,
        lineWidthMaxPixels: lineWidthMaxPixels,
        lineJointRounded: lineJointRounded,
        lineMiterLimit: lineMiterLimit,
        lineDashJustified: lineDashJustified,
        material: material,
        getElevation: getElevation,
        getFillColor: getFillColor,
        getLineColor: getLineColor,
        getLineWidth: getLineWidth,
        getLineDashArray: getLineDashArray
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
        data: data,
        getPolygon: function getPolygon(x) {
          return (0, _s2Utils.getS2Polygon)(getS2Token(x));
        }
      });
    }
  }]);
  return S2Layer;
}(_keplerOutdatedDeck.CompositeLayer);

exports.default = S2Layer;
S2Layer.layerName = 'S2Layer';
S2Layer.defaultProps = defaultProps;
//# sourceMappingURL=s2-layer.js.map