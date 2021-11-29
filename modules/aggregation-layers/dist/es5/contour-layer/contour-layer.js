"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _math = require("math.gl");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _contourUtils = require("./contour-utils");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _gridAggregationUtils = require("../utils/gpu-grid-aggregation/grid-aggregation-utils");

const DEFAULT_COLOR = [255, 255, 255, 255];
const DEFAULT_STROKE_WIDTH = 1;
const DEFAULT_THRESHOLD = 1;
const defaultProps = {
  cellSize: {
    type: 'number',
    min: 1,
    max: 1000,
    value: 1000
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getWeight: {
    type: 'accessor',
    value: x => 1
  },
  contours: [{
    threshold: DEFAULT_THRESHOLD
  }],
  fp64: false,
  zOffset: 0.005
};

class ContourLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    const {
      gl
    } = this.context;
    const options = {
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

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    let dataChanged = false;
    let contoursChanged = false;

    const aggregationFlags = this._getAggregationFlags({
      oldProps,
      props,
      changeFlags
    });

    if (aggregationFlags) {
      dataChanged = true;
      this.setState({
        countsData: null
      });

      this._aggregateData(aggregationFlags);
    }

    if (this._shouldRebuildContours({
      oldProps,
      props
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

  finalizeState() {
    super.finalizeState();
    this.state.gridAggregator.delete();
  }

  renderLayers() {
    const {
      contourSegments,
      contourPolygons
    } = this.state.contourData;
    const hasIsolines = contourSegments && contourSegments.length > 0;
    const hasIsobands = contourPolygons && contourPolygons.length > 0;
    const lineLayer = hasIsolines && new _keplerOutdatedDeck2.LineLayer(this._getLineLayerProps());
    const solidPolygonLayer = hasIsobands && new _keplerOutdatedDeck2.SolidPolygonLayer(this._getSolidPolygonLayerProps());
    return [lineLayer, solidPolygonLayer];
  }

  _aggregateData(aggregationFlags) {
    const {
      data,
      cellSize: cellSizeMeters,
      getPosition,
      getWeight,
      gpuAggregation,
      fp64,
      coordinateSystem
    } = this.props;
    const {
      weights,
      gridSize,
      gridOrigin,
      cellSize,
      boundingBox
    } = (0, _gridAggregationUtils.pointToDensityGridData)({
      data,
      cellSizeMeters,
      getPosition,
      weightParams: {
        count: {
          getWeight
        }
      },
      gpuAggregation,
      gpuGridAggregator: this.state.gridAggregator,
      fp64,
      coordinateSystem,
      viewport: this.context.viewport,
      boundingBox: this.state.boundingBox,
      aggregationFlags
    });
    this.setState({
      countsData: weights.count.aggregationData,
      countsBuffer: weights.count.aggregationBuffer,
      gridSize,
      gridOrigin,
      cellSize,
      boundingBox
    });
  }

  _generateContours() {
    const {
      gridSize,
      gridOrigin,
      cellSize,
      thresholdData
    } = this.state;
    let {
      countsData
    } = this.state;

    if (!countsData) {
      const {
        countsBuffer
      } = this.state;
      countsData = countsBuffer.getData();
      this.setState({
        countsData
      });
    }

    const {
      cellWeights
    } = _gpuGridAggregator.default.getCellData({
      countsData
    });

    const contourData = (0, _contourUtils.generateContours)({
      thresholdData,
      cellWeights,
      gridSize,
      gridOrigin,
      cellSize
    });
    this.setState({
      contourData
    });
  }

  _getAggregationFlags(_ref2) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref2;
    let aggregationFlags = null;

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

  _getLineLayerProps() {
    const {
      fp64
    } = this.props;
    const {
      colorTrigger,
      strokeWidthTrigger
    } = this.state;
    return this.getSubLayerProps({
      id: 'contour-line-layer',
      data: this.state.contourData.contourSegments,
      fp64,
      getSourcePosition: d => d.start,
      getTargetPosition: d => d.end,
      getColor: this._onGetSublayerColor.bind(this),
      getWidth: this._onGetSublayerStrokeWidth.bind(this),
      widthUnits: 'pixels',
      updateTriggers: {
        getColor: colorTrigger,
        getWidth: strokeWidthTrigger
      }
    });
  }

  _getSolidPolygonLayerProps() {
    const {
      fp64
    } = this.props;
    const {
      colorTrigger
    } = this.state;
    return this.getSubLayerProps({
      id: 'contour-solid-polygon-layer',
      data: this.state.contourData.contourPolygons,
      fp64,
      getPolygon: d => d.vertices,
      getFillColor: this._onGetSublayerColor.bind(this),
      updateTriggers: {
        getFillColor: colorTrigger
      }
    });
  }

  _onGetSublayerColor(element) {
    const {
      contours
    } = this.props;
    let color = DEFAULT_COLOR;
    contours.forEach(data => {
      if ((0, _math.equals)(data.threshold, element.threshold)) {
        color = data.color || DEFAULT_COLOR;
      }
    });
    return color;
  }

  _onGetSublayerStrokeWidth(segment) {
    const {
      contours
    } = this.props;
    let strokeWidth = DEFAULT_STROKE_WIDTH;
    contours.some(contour => {
      if (contour.threshold === segment.threshold) {
        strokeWidth = contour.strokeWidth || DEFAULT_STROKE_WIDTH;
        return true;
      }

      return false;
    });
    return strokeWidth;
  }

  _shouldRebuildContours(_ref3) {
    let {
      oldProps,
      props
    } = _ref3;

    if (!oldProps.contours || !oldProps.zOffset || oldProps.contours.length !== props.contours.length || oldProps.zOffset !== props.zOffset) {
      return true;
    }

    const oldThresholds = oldProps.contours.map(x => x.threshold);
    const thresholds = props.contours.map(x => x.threshold);
    return thresholds.some((_, i) => !(0, _math.equals)(thresholds[i], oldThresholds[i]));
  }

  _updateSubLayerTriggers(oldProps, props) {
    if (oldProps && oldProps.contours && props && props.contours) {
      if (props.contours.some((contour, i) => contour.color !== oldProps.contours[i].color)) {
        this.state.colorTrigger++;
      }

      if (props.contours.some((contour, i) => contour.strokeWidth !== oldProps.contours[i].strokeWidth)) {
        this.state.strokeWidthTrigger++;
      }
    }
  }

  _updateThresholdData(props) {
    const thresholdData = props.contours.map((x, index) => {
      return {
        threshold: x.threshold,
        zIndex: x.zIndex || index,
        zOffset: props.zOffset
      };
    });
    this.setState({
      thresholdData
    });
  }

}

exports.default = ContourLayer;
ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;
//# sourceMappingURL=contour-layer.js.map