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

var _core = require("@luma.gl/core");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _aggregationOperationUtils = require("../utils/aggregation-operation-utils");

var _gridAggregationUtils = require("../utils/gpu-grid-aggregation/grid-aggregation-utils");

var _colorUtils = require("../utils/color-utils");

var _gpuGridCellLayer = _interopRequireDefault(require("./gpu-grid-cell-layer"));

var _gridAggregator = require("./../cpu-grid-layer/grid-aggregator");

var defaultMaterial = new _core.PhongMaterial();
var defaultProps = {
  colorDomain: null,
  colorRange: _colorUtils.defaultColorRange,
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
  (0, _inherits2.default)(GPUGridLayer, _CompositeLayer);

  function GPUGridLayer() {
    (0, _classCallCheck2.default)(this, GPUGridLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(GPUGridLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(GPUGridLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;

      var isSupported = _gpuGridAggregator.default.isSupported(gl);

      if (!isSupported) {
        _keplerOutdatedDeck.log.error('GPUGridLayer is not supported on this browser, use GridLayer instead')();
      }

      var options = {
        id: "".concat(this.id, "-gpu-aggregator"),
        shaderCache: this.context.shaderCache
      };
      this.state = {
        gpuGridAggregator: new _gpuGridAggregator.default(gl, options),
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
      (0, _get2.default)((0, _getPrototypeOf2.default)(GPUGridLayer.prototype), "finalizeState", this).call(this);
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

        var colorInfo = _gpuGridAggregator.default.getAggregationData(Object.assign({
          pixelIndex: index
        }, gpuGridAggregator.getData('color')));

        var elevationInfo = _gpuGridAggregator.default.getAggregationData(Object.assign({
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
            var cpuAggregation = (0, _gridAggregator.pointToDensityGridDataCPU)(data, this.props.cellSize, getPosition);
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
          operation: _aggregationOperationUtils.AGGREGATION_OPERATION[colorAggregation] || _aggregationOperationUtils.AGGREGATION_OPERATION[defaultProps.colorAggregation],
          needMin: true,
          needMax: true,
          combineMaxMin: true
        },
        elevation: {
          getWeight: getElevationWeight,
          operation: _aggregationOperationUtils.AGGREGATION_OPERATION[elevationAggregation] || _aggregationOperationUtils.AGGREGATION_OPERATION[defaultProps.elevationAggregation],
          needMin: true,
          needMax: true,
          combineMaxMin: true
        }
      };

      var _pointToDensityGridDa = (0, _gridAggregationUtils.pointToDensityGridData)({
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
      var colorRange = (0, _colorUtils.colorRangeToFlatArray)(this.props.colorRange, Float32Array, 255);
      var SubLayerClass = this.getSubLayerClass('gpu-grid-cell', _gpuGridCellLayer.default);
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
}(_keplerOutdatedDeck.CompositeLayer);

exports.default = GPUGridLayer;
GPUGridLayer.layerName = 'GPUGridLayer';
GPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=gpu-grid-layer.js.map