import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { equals } from 'math.gl';
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { LineLayer, SolidPolygonLayer } from 'kepler-outdated-deck.gl-layers';
import { generateContours } from './contour-utils';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { pointToDensityGridData } from '../utils/gpu-grid-aggregation/grid-aggregation-utils';
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
  _inherits(ContourLayer, _CompositeLayer);

  function ContourLayer() {
    _classCallCheck(this, ContourLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(ContourLayer).apply(this, arguments));
  }

  _createClass(ContourLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;
      var options = {
        id: "".concat(this.id, "-gpu-aggregator"),
        shaderCache: this.context.shaderCache
      };
      this.state = {
        contourData: {},
        gridAggregator: new GPUGridAggregator(gl, options),
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
      _get(_getPrototypeOf(ContourLayer.prototype), "finalizeState", this).call(this);

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
      var lineLayer = hasIsolines && new LineLayer(this._getLineLayerProps());
      var solidPolygonLayer = hasIsobands && new SolidPolygonLayer(this._getSolidPolygonLayerProps());
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

      var _pointToDensityGridDa = pointToDensityGridData({
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

      var _GPUGridAggregator$ge = GPUGridAggregator.getCellData({
        countsData: countsData
      }),
          cellWeights = _GPUGridAggregator$ge.cellWeights;

      var contourData = generateContours({
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
        if (equals(data.threshold, element.threshold)) {
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
        return !equals(thresholds[i], oldThresholds[i]);
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
}(CompositeLayer);

export { ContourLayer as default };
ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;
//# sourceMappingURL=contour-layer.js.map