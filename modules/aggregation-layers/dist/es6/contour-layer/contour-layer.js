import { equals } from 'math.gl';
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { LineLayer, SolidPolygonLayer } from 'kepler-outdated-deck.gl-layers';
import { generateContours } from './contour-utils';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { pointToDensityGridData } from '../utils/gpu-grid-aggregation/grid-aggregation-utils';
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
export default class ContourLayer extends CompositeLayer {
  initializeState() {
    const gl = this.context.gl;
    const options = {
      id: `${this.id}-gpu-aggregator`,
      shaderCache: this.context.shaderCache
    };
    this.state = {
      contourData: {},
      gridAggregator: new GPUGridAggregator(gl, options),
      colorTrigger: 0,
      strokeWidthTrigger: 0
    };
  }

  updateState(_ref) {
    let oldProps = _ref.oldProps,
        props = _ref.props,
        changeFlags = _ref.changeFlags;
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
    const _this$state$contourDa = this.state.contourData,
          contourSegments = _this$state$contourDa.contourSegments,
          contourPolygons = _this$state$contourDa.contourPolygons;
    const hasIsolines = contourSegments && contourSegments.length > 0;
    const hasIsobands = contourPolygons && contourPolygons.length > 0;
    const lineLayer = hasIsolines && new LineLayer(this._getLineLayerProps());
    const solidPolygonLayer = hasIsobands && new SolidPolygonLayer(this._getSolidPolygonLayerProps());
    return [lineLayer, solidPolygonLayer];
  }

  _aggregateData(aggregationFlags) {
    const _this$props = this.props,
          data = _this$props.data,
          cellSizeMeters = _this$props.cellSize,
          getPosition = _this$props.getPosition,
          getWeight = _this$props.getWeight,
          gpuAggregation = _this$props.gpuAggregation,
          fp64 = _this$props.fp64,
          coordinateSystem = _this$props.coordinateSystem;

    const _pointToDensityGridDa = pointToDensityGridData({
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
    }),
          weights = _pointToDensityGridDa.weights,
          gridSize = _pointToDensityGridDa.gridSize,
          gridOrigin = _pointToDensityGridDa.gridOrigin,
          cellSize = _pointToDensityGridDa.cellSize,
          boundingBox = _pointToDensityGridDa.boundingBox;

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
    const _this$state = this.state,
          gridSize = _this$state.gridSize,
          gridOrigin = _this$state.gridOrigin,
          cellSize = _this$state.cellSize,
          thresholdData = _this$state.thresholdData;
    let countsData = this.state.countsData;

    if (!countsData) {
      const countsBuffer = this.state.countsBuffer;
      countsData = countsBuffer.getData();
      this.setState({
        countsData
      });
    }

    const _GPUGridAggregator$ge = GPUGridAggregator.getCellData({
      countsData
    }),
          cellWeights = _GPUGridAggregator$ge.cellWeights;

    const contourData = generateContours({
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
    let oldProps = _ref2.oldProps,
        props = _ref2.props,
        changeFlags = _ref2.changeFlags;
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
    const fp64 = this.props.fp64;
    const _this$state2 = this.state,
          colorTrigger = _this$state2.colorTrigger,
          strokeWidthTrigger = _this$state2.strokeWidthTrigger;
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
    const fp64 = this.props.fp64;
    const colorTrigger = this.state.colorTrigger;
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
    const contours = this.props.contours;
    let color = DEFAULT_COLOR;
    contours.forEach(data => {
      if (equals(data.threshold, element.threshold)) {
        color = data.color || DEFAULT_COLOR;
      }
    });
    return color;
  }

  _onGetSublayerStrokeWidth(segment) {
    const contours = this.props.contours;
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
    let oldProps = _ref3.oldProps,
        props = _ref3.props;

    if (!oldProps.contours || !oldProps.zOffset || oldProps.contours.length !== props.contours.length || oldProps.zOffset !== props.zOffset) {
      return true;
    }

    const oldThresholds = oldProps.contours.map(x => x.threshold);
    const thresholds = props.contours.map(x => x.threshold);
    return thresholds.some((_, i) => !equals(thresholds[i], oldThresholds[i]));
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
ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;
//# sourceMappingURL=contour-layer.js.map