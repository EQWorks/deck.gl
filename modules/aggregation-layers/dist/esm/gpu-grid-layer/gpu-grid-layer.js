import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer, log } from 'kepler-outdated-deck.gl-core';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { AGGREGATION_OPERATION } from '../utils/aggregation-operation-utils';
import { pointToDensityGridData } from '../utils/gpu-grid-aggregation/grid-aggregation-utils';
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import GPUGridCellLayer from './gpu-grid-cell-layer';
import { pointToDensityGridDataCPU } from './../cpu-grid-layer/grid-aggregator';
var defaultMaterial = new PhongMaterial();
var defaultProps = {
  colorDomain: null,
  colorRange: defaultColorRange,
  getColorWeight: {
    type: 'accessor',
    value: function value(x) {
      return 1;
    }
  },
  colorAggregation: 'SUM',
  elevationDomain: null,
  elevationRange: [0, 1000],
  getElevationWeight: {
    type: 'accessor',
    value: function value(x) {
      return 1;
    }
  },
  elevationAggregation: 'SUM',
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  cellSize: {
    type: 'number',
    min: 0,
    max: 1000,
    value: 1000
  },
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  extruded: false,
  fp64: false,
  material: defaultMaterial,
  gpuAggregation: true
};

var GPUGridLayer = function (_CompositeLayer) {
  _inherits(GPUGridLayer, _CompositeLayer);

  function GPUGridLayer() {
    _classCallCheck(this, GPUGridLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(GPUGridLayer).apply(this, arguments));
  }

  _createClass(GPUGridLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;
      var isSupported = GPUGridAggregator.isSupported(gl);

      if (!isSupported) {
        log.error('GPUGridLayer is not supported on this browser, use GridLayer instead')();
      }

      var options = {
        id: "".concat(this.id, "-gpu-aggregator"),
        shaderCache: this.context.shaderCache
      };
      this.state = {
        gpuGridAggregator: new GPUGridAggregator(gl, options),
        isSupported: isSupported
      };
    }
  }, {
    key: "updateState",
    value: function updateState(opts) {
      var aggregationFlags = this.getAggregationFlags(opts);

      if (aggregationFlags) {
        this.getLayerData(aggregationFlags);
        this.setState({
          gridHash: null
        });
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(GPUGridLayer.prototype), "finalizeState", this).call(this);

      this.state.gpuGridAggregator.delete();
    }
  }, {
    key: "getAggregationFlags",
    value: function getAggregationFlags(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var aggregationFlags = null;

      if (!this.state.isSupported) {
        return false;
      }

      if (this.isDataChanged({
        oldProps: oldProps,
        props: props,
        changeFlags: changeFlags
      })) {
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
    key: "isDataChanged",
    value: function isDataChanged(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      if (changeFlags.dataChanged) {
        return true;
      }

      if (oldProps.gpuAggregation !== props.gpuAggregation) {
        return true;
      }

      if (oldProps.colorAggregation !== props.colorAggregation || oldProps.elevationAggregation !== props.elevationAggregation) {
        return true;
      }

      if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition || changeFlags.updateTriggersChanged.getColorWeight || changeFlags.updateTriggersChanged.getElevationWeight)) {
        return true;
      }

      return false;
    }
  }, {
    key: "getHashKeyForIndex",
    value: function getHashKeyForIndex(index) {
      var _this$state = this.state,
          gridSize = _this$state.gridSize,
          gridOrigin = _this$state.gridOrigin,
          cellSize = _this$state.cellSize;
      var yIndex = Math.floor(index / gridSize[0]);
      var xIndex = index - yIndex * gridSize[0];
      var latIdx = Math.floor((yIndex * cellSize[1] + gridOrigin[1] + 90 + cellSize[1] / 2) / cellSize[1]);
      var lonIdx = Math.floor((xIndex * cellSize[0] + gridOrigin[0] + 180 + cellSize[0] / 2) / cellSize[0]);
      return "".concat(latIdx, "-").concat(lonIdx);
    }
  }, {
    key: "getPositionForIndex",
    value: function getPositionForIndex(index) {
      var _this$state2 = this.state,
          gridSize = _this$state2.gridSize,
          gridOrigin = _this$state2.gridOrigin,
          cellSize = _this$state2.cellSize;
      var yIndex = Math.floor(index / gridSize[0]);
      var xIndex = index - yIndex * gridSize[0];
      var yPos = yIndex * cellSize[1] + gridOrigin[1];
      var xPos = xIndex * cellSize[0] + gridOrigin[0];
      return [xPos, yPos];
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref3) {
      var info = _ref3.info,
          mode = _ref3.mode;
      var index = info.index;
      var object = null;

      if (index >= 0) {
        var gpuGridAggregator = this.state.gpuGridAggregator;
        var position = this.getPositionForIndex(index);
        var colorInfo = GPUGridAggregator.getAggregationData(Object.assign({
          pixelIndex: index
        }, gpuGridAggregator.getData('color')));
        var elevationInfo = GPUGridAggregator.getAggregationData(Object.assign({
          pixelIndex: index
        }, gpuGridAggregator.getData('elevation')));
        object = {
          colorValue: colorInfo.cellWeight,
          elevationValue: elevationInfo.cellWeight,
          count: colorInfo.cellCount || elevationInfo.cellCount,
          position: position,
          totalCount: colorInfo.totalCount || elevationInfo.totalCount
        };

        if (mode !== 'hover') {
          var _this$props = this.props,
              data = _this$props.data,
              getPosition = _this$props.getPosition;
          var gridHash = this.state.gridHash;

          if (!gridHash) {
            var cpuAggregation = pointToDensityGridDataCPU(data, this.props.cellSize, getPosition);
            gridHash = cpuAggregation.gridHash;
            this.setState({
              gridHash: gridHash
            });
          }

          var key = this.getHashKeyForIndex(index);
          var cpuAggregationData = gridHash[key];
          Object.assign(object, cpuAggregationData);
        }
      }

      return Object.assign(info, {
        picked: Boolean(object),
        object: object
      });
    }
  }, {
    key: "getLayerData",
    value: function getLayerData(aggregationFlags) {
      var _this$props2 = this.props,
          data = _this$props2.data,
          cellSizeMeters = _this$props2.cellSize,
          getPosition = _this$props2.getPosition,
          gpuAggregation = _this$props2.gpuAggregation,
          getColorWeight = _this$props2.getColorWeight,
          colorAggregation = _this$props2.colorAggregation,
          getElevationWeight = _this$props2.getElevationWeight,
          elevationAggregation = _this$props2.elevationAggregation,
          fp64 = _this$props2.fp64;
      var weightParams = {
        color: {
          getWeight: getColorWeight,
          operation: AGGREGATION_OPERATION[colorAggregation] || AGGREGATION_OPERATION[defaultProps.colorAggregation],
          needMin: true,
          needMax: true,
          combineMaxMin: true
        },
        elevation: {
          getWeight: getElevationWeight,
          operation: AGGREGATION_OPERATION[elevationAggregation] || AGGREGATION_OPERATION[defaultProps.elevationAggregation],
          needMin: true,
          needMax: true,
          combineMaxMin: true
        }
      };

      var _pointToDensityGridDa = pointToDensityGridData({
        data: data,
        cellSizeMeters: cellSizeMeters,
        getPosition: getPosition,
        weightParams: weightParams,
        gpuAggregation: gpuAggregation,
        gpuGridAggregator: this.state.gpuGridAggregator,
        boundingBox: this.state.boundingBox,
        aggregationFlags: aggregationFlags,
        fp64: fp64
      }),
          weights = _pointToDensityGridDa.weights,
          gridSize = _pointToDensityGridDa.gridSize,
          gridOrigin = _pointToDensityGridDa.gridOrigin,
          cellSize = _pointToDensityGridDa.cellSize,
          boundingBox = _pointToDensityGridDa.boundingBox;

      this.setState({
        weights: weights,
        gridSize: gridSize,
        gridOrigin: gridOrigin,
        cellSize: cellSize,
        boundingBox: boundingBox
      });
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      if (!this.state.isSupported) {
        return null;
      }

      var _this$props3 = this.props,
          elevationScale = _this$props3.elevationScale,
          fp64 = _this$props3.fp64,
          extruded = _this$props3.extruded,
          cellSizeMeters = _this$props3.cellSize,
          coverage = _this$props3.coverage,
          material = _this$props3.material,
          elevationRange = _this$props3.elevationRange,
          colorDomain = _this$props3.colorDomain,
          elevationDomain = _this$props3.elevationDomain;
      var _this$state3 = this.state,
          weights = _this$state3.weights,
          gridSize = _this$state3.gridSize,
          gridOrigin = _this$state3.gridOrigin,
          cellSize = _this$state3.cellSize;
      var colorRange = colorRangeToFlatArray(this.props.colorRange, Float32Array, 255);
      var SubLayerClass = this.getSubLayerClass('gpu-grid-cell', GPUGridCellLayer);
      return new SubLayerClass({
        gridSize: gridSize,
        gridOrigin: gridOrigin,
        gridOffset: cellSize,
        colorRange: colorRange,
        elevationRange: elevationRange,
        colorDomain: colorDomain,
        elevationDomain: elevationDomain,
        fp64: fp64,
        cellSize: cellSizeMeters,
        coverage: coverage,
        material: material,
        elevationScale: elevationScale,
        extruded: extruded
      }, this.getSubLayerProps({
        id: 'gpu-grid-cell'
      }), {
        data: weights,
        numInstances: gridSize[0] * gridSize[1]
      });
    }
  }]);

  return GPUGridLayer;
}(CompositeLayer);

export { GPUGridLayer as default };
GPUGridLayer.layerName = 'GPUGridLayer';
GPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=gpu-grid-layer.js.map