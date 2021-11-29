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

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _math = require("math.gl");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _contourUtils = require("./contour-utils");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _gridAggregationUtils = require("../utils/gpu-grid-aggregation/grid-aggregation-utils");

var DEFAULT_COLOR = [255, 255, 255, 255];
var DEFAULT_STROKE_WIDTH = 1;
var DEFAULT_THRESHOLD = 1;
var defaultProps = {
  cellSize: {
    type: 'number',
    min: 1,
    max: 1000,
    value: 1000
  },
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getWeight: {
    type: 'accessor',
    value: function value(x) {
      return 1;
    }
  },
  contours: [{
    threshold: DEFAULT_THRESHOLD
  }],
  fp64: false,
  zOffset: 0.005
};

var ContourLayer = function (_CompositeLayer) {
  (0, _inherits2.default)(ContourLayer, _CompositeLayer);

  function ContourLayer() {
    (0, _classCallCheck2.default)(this, ContourLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ContourLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(ContourLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;
      var options = {
        id: "".concat(this.id, "-gpu-aggregator"),
        shaderCache: this.context.shaderCache
      };
      this.state = {
        contourData: {},
        gridAggregator: new _gpuGridAggregator.default(gl, options),
        colorTrigger: 0,
        strokeWidthTrigger: 0
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var dataChanged = false;
      var contoursChanged = false;

      var aggregationFlags = this._getAggregationFlags({
        oldProps: oldProps,
        props: props,
        changeFlags: changeFlags
      });

      if (aggregationFlags) {
        dataChanged = true;
        this.setState({
          countsData: null
        });

        this._aggregateData(aggregationFlags);
      }

      if (this._shouldRebuildContours({
        oldProps: oldProps,
        props: props
      })) {
        contoursChanged = true;

        this._updateThresholdData(props);
      }

      if (dataChanged || contoursChanged) {
        this._generateContours();
      } else {
        this._updateSubLayerTriggers(oldProps, props);
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(ContourLayer.prototype), "finalizeState", this).call(this);
      this.state.gridAggregator.delete();
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this$state$contourDa = this.state.contourData,
          contourSegments = _this$state$contourDa.contourSegments,
          contourPolygons = _this$state$contourDa.contourPolygons;
      var hasIsolines = contourSegments && contourSegments.length > 0;
      var hasIsobands = contourPolygons && contourPolygons.length > 0;
      var lineLayer = hasIsolines && new _keplerOutdatedDeck2.LineLayer(this._getLineLayerProps());
      var solidPolygonLayer = hasIsobands && new _keplerOutdatedDeck2.SolidPolygonLayer(this._getSolidPolygonLayerProps());
      return [lineLayer, solidPolygonLayer];
    }
  }, {
    key: "_aggregateData",
    value: function _aggregateData(aggregationFlags) {
      var _this$props = this.props,
          data = _this$props.data,
          cellSizeMeters = _this$props.cellSize,
          getPosition = _this$props.getPosition,
          getWeight = _this$props.getWeight,
          gpuAggregation = _this$props.gpuAggregation,
          fp64 = _this$props.fp64,
          coordinateSystem = _this$props.coordinateSystem;

      var _pointToDensityGridDa = (0, _gridAggregationUtils.pointToDensityGridData)({
        data: data,
        cellSizeMeters: cellSizeMeters,
        getPosition: getPosition,
        weightParams: {
          count: {
            getWeight: getWeight
          }
        },
        gpuAggregation: gpuAggregation,
        gpuGridAggregator: this.state.gridAggregator,
        fp64: fp64,
        coordinateSystem: coordinateSystem,
        viewport: this.context.viewport,
        boundingBox: this.state.boundingBox,
        aggregationFlags: aggregationFlags
      }),
          weights = _pointToDensityGridDa.weights,
          gridSize = _pointToDensityGridDa.gridSize,
          gridOrigin = _pointToDensityGridDa.gridOrigin,
          cellSize = _pointToDensityGridDa.cellSize,
          boundingBox = _pointToDensityGridDa.boundingBox;

      this.setState({
        countsData: weights.count.aggregationData,
        countsBuffer: weights.count.aggregationBuffer,
        gridSize: gridSize,
        gridOrigin: gridOrigin,
        cellSize: cellSize,
        boundingBox: boundingBox
      });
    }
  }, {
    key: "_generateContours",
    value: function _generateContours() {
      var _this$state = this.state,
          gridSize = _this$state.gridSize,
          gridOrigin = _this$state.gridOrigin,
          cellSize = _this$state.cellSize,
          thresholdData = _this$state.thresholdData;
      var countsData = this.state.countsData;

      if (!countsData) {
        var countsBuffer = this.state.countsBuffer;
        countsData = countsBuffer.getData();
        this.setState({
          countsData: countsData
        });
      }

      var _GPUGridAggregator$ge = _gpuGridAggregator.default.getCellData({
        countsData: countsData
      }),
          cellWeights = _GPUGridAggregator$ge.cellWeights;

      var contourData = (0, _contourUtils.generateContours)({
        thresholdData: thresholdData,
        cellWeights: cellWeights,
        gridSize: gridSize,
        gridOrigin: gridOrigin,
        cellSize: cellSize
      });
      this.setState({
        contourData: contourData
      });
    }
  }, {
    key: "_getAggregationFlags",
    value: function _getAggregationFlags(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;
      var aggregationFlags = null;

      if (changeFlags.dataChanged || oldProps.gpuAggregation !== props.gpuAggregation || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition)) {
        aggregationFlags = Object.assign({}, aggregationFlags, {
          dataChanged: true
        });
      }

      if (oldProps.cellSize !== props.cellSize) {
        aggregationFlags = Object.assign({}, aggregationFlags, {
          cellSizeChanged: true
        });
      }

      return aggregationFlags;
    }
  }, {
    key: "_getLineLayerProps",
    value: function _getLineLayerProps() {
      var fp64 = this.props.fp64;
      var _this$state2 = this.state,
          colorTrigger = _this$state2.colorTrigger,
          strokeWidthTrigger = _this$state2.strokeWidthTrigger;
      return this.getSubLayerProps({
        id: 'contour-line-layer',
        data: this.state.contourData.contourSegments,
        fp64: fp64,
        getSourcePosition: function getSourcePosition(d) {
          return d.start;
        },
        getTargetPosition: function getTargetPosition(d) {
          return d.end;
        },
        getColor: this._onGetSublayerColor.bind(this),
        getWidth: this._onGetSublayerStrokeWidth.bind(this),
        widthUnits: 'pixels',
        updateTriggers: {
          getColor: colorTrigger,
          getWidth: strokeWidthTrigger
        }
      });
    }
  }, {
    key: "_getSolidPolygonLayerProps",
    value: function _getSolidPolygonLayerProps() {
      var fp64 = this.props.fp64;
      var colorTrigger = this.state.colorTrigger;
      return this.getSubLayerProps({
        id: 'contour-solid-polygon-layer',
        data: this.state.contourData.contourPolygons,
        fp64: fp64,
        getPolygon: function getPolygon(d) {
          return d.vertices;
        },
        getFillColor: this._onGetSublayerColor.bind(this),
        updateTriggers: {
          getFillColor: colorTrigger
        }
      });
    }
  }, {
    key: "_onGetSublayerColor",
    value: function _onGetSublayerColor(element) {
      var contours = this.props.contours;
      var color = DEFAULT_COLOR;
      contours.forEach(function (data) {
        if ((0, _math.equals)(data.threshold, element.threshold)) {
          color = data.color || DEFAULT_COLOR;
        }
      });
      return color;
    }
  }, {
    key: "_onGetSublayerStrokeWidth",
    value: function _onGetSublayerStrokeWidth(segment) {
      var contours = this.props.contours;
      var strokeWidth = DEFAULT_STROKE_WIDTH;
      contours.some(function (contour) {
        if (contour.threshold === segment.threshold) {
          strokeWidth = contour.strokeWidth || DEFAULT_STROKE_WIDTH;
          return true;
        }

        return false;
      });
      return strokeWidth;
    }
  }, {
    key: "_shouldRebuildContours",
    value: function _shouldRebuildContours(_ref3) {
      var oldProps = _ref3.oldProps,
          props = _ref3.props;

      if (!oldProps.contours || !oldProps.zOffset || oldProps.contours.length !== props.contours.length || oldProps.zOffset !== props.zOffset) {
        return true;
      }

      var oldThresholds = oldProps.contours.map(function (x) {
        return x.threshold;
      });
      var thresholds = props.contours.map(function (x) {
        return x.threshold;
      });
      return thresholds.some(function (_, i) {
        return !(0, _math.equals)(thresholds[i], oldThresholds[i]);
      });
    }
  }, {
    key: "_updateSubLayerTriggers",
    value: function _updateSubLayerTriggers(oldProps, props) {
      if (oldProps && oldProps.contours && props && props.contours) {
        if (props.contours.some(function (contour, i) {
          return contour.color !== oldProps.contours[i].color;
        })) {
          this.state.colorTrigger++;
        }

        if (props.contours.some(function (contour, i) {
          return contour.strokeWidth !== oldProps.contours[i].strokeWidth;
        })) {
          this.state.strokeWidthTrigger++;
        }
      }
    }
  }, {
    key: "_updateThresholdData",
    value: function _updateThresholdData(props) {
      var thresholdData = props.contours.map(function (x, index) {
        return {
          threshold: x.threshold,
          zIndex: x.zIndex || index,
          zOffset: props.zOffset
        };
      });
      this.setState({
        thresholdData: thresholdData
      });
    }
  }]);
  return ContourLayer;
}(_keplerOutdatedDeck.CompositeLayer);

exports.default = ContourLayer;
ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;
//# sourceMappingURL=contour-layer.js.map