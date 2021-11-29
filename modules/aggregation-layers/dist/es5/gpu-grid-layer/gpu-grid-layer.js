"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _gpuGridAggregator = _interopRequireDefault(require("../utils/gpu-grid-aggregation/gpu-grid-aggregator"));

var _aggregationOperationUtils = require("../utils/aggregation-operation-utils");

var _gridAggregationUtils = require("../utils/gpu-grid-aggregation/grid-aggregation-utils");

var _colorUtils = require("../utils/color-utils");

var _gpuGridCellLayer = _interopRequireDefault(require("./gpu-grid-cell-layer"));

var _gridAggregator = require("./../cpu-grid-layer/grid-aggregator");

const defaultMaterial = new _core.PhongMaterial();
const defaultProps = {
  colorDomain: null,
  colorRange: _colorUtils.defaultColorRange,
  getColorWeight: {
    type: 'accessor',
    value: x => 1
  },
  colorAggregation: 'SUM',
  elevationDomain: null,
  elevationRange: [0, 1000],
  getElevationWeight: {
    type: 'accessor',
    value: x => 1
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
    value: x => x.position
  },
  extruded: false,
  fp64: false,
  material: defaultMaterial,
  gpuAggregation: true
};

class GPUGridLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    const {
      gl
    } = this.context;

    const isSupported = _gpuGridAggregator.default.isSupported(gl);

    if (!isSupported) {
      _keplerOutdatedDeck.log.error('GPUGridLayer is not supported on this browser, use GridLayer instead')();
    }

    const options = {
      id: "".concat(this.id, "-gpu-aggregator"),
      shaderCache: this.context.shaderCache
    };
    this.state = {
      gpuGridAggregator: new _gpuGridAggregator.default(gl, options),
      isSupported
    };
  }

  updateState(opts) {
    const aggregationFlags = this.getAggregationFlags(opts);

    if (aggregationFlags) {
      this.getLayerData(aggregationFlags);
      this.setState({
        gridHash: null
      });
    }
  }

  finalizeState() {
    super.finalizeState();
    this.state.gpuGridAggregator.delete();
  }

  getAggregationFlags(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    let aggregationFlags = null;

    if (!this.state.isSupported) {
      return false;
    }

    if (this.isDataChanged({
      oldProps,
      props,
      changeFlags
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

  isDataChanged(_ref2) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref2;

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

  getHashKeyForIndex(index) {
    const {
      gridSize,
      gridOrigin,
      cellSize
    } = this.state;
    const yIndex = Math.floor(index / gridSize[0]);
    const xIndex = index - yIndex * gridSize[0];
    const latIdx = Math.floor((yIndex * cellSize[1] + gridOrigin[1] + 90 + cellSize[1] / 2) / cellSize[1]);
    const lonIdx = Math.floor((xIndex * cellSize[0] + gridOrigin[0] + 180 + cellSize[0] / 2) / cellSize[0]);
    return "".concat(latIdx, "-").concat(lonIdx);
  }

  getPositionForIndex(index) {
    const {
      gridSize,
      gridOrigin,
      cellSize
    } = this.state;
    const yIndex = Math.floor(index / gridSize[0]);
    const xIndex = index - yIndex * gridSize[0];
    const yPos = yIndex * cellSize[1] + gridOrigin[1];
    const xPos = xIndex * cellSize[0] + gridOrigin[0];
    return [xPos, yPos];
  }

  getPickingInfo(_ref3) {
    let {
      info,
      mode
    } = _ref3;
    const {
      index
    } = info;
    let object = null;

    if (index >= 0) {
      const {
        gpuGridAggregator
      } = this.state;
      const position = this.getPositionForIndex(index);

      const colorInfo = _gpuGridAggregator.default.getAggregationData(Object.assign({
        pixelIndex: index
      }, gpuGridAggregator.getData('color')));

      const elevationInfo = _gpuGridAggregator.default.getAggregationData(Object.assign({
        pixelIndex: index
      }, gpuGridAggregator.getData('elevation')));

      object = {
        colorValue: colorInfo.cellWeight,
        elevationValue: elevationInfo.cellWeight,
        count: colorInfo.cellCount || elevationInfo.cellCount,
        position,
        totalCount: colorInfo.totalCount || elevationInfo.totalCount
      };

      if (mode !== 'hover') {
        const {
          data,
          getPosition
        } = this.props;
        let {
          gridHash
        } = this.state;

        if (!gridHash) {
          const cpuAggregation = (0, _gridAggregator.pointToDensityGridDataCPU)(data, this.props.cellSize, getPosition);
          gridHash = cpuAggregation.gridHash;
          this.setState({
            gridHash
          });
        }

        const key = this.getHashKeyForIndex(index);
        const cpuAggregationData = gridHash[key];
        Object.assign(object, cpuAggregationData);
      }
    }

    return Object.assign(info, {
      picked: Boolean(object),
      object
    });
  }

  getLayerData(aggregationFlags) {
    const {
      data,
      cellSize: cellSizeMeters,
      getPosition,
      gpuAggregation,
      getColorWeight,
      colorAggregation,
      getElevationWeight,
      elevationAggregation,
      fp64
    } = this.props;
    const weightParams = {
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
      weightParams,
      gpuAggregation,
      gpuGridAggregator: this.state.gpuGridAggregator,
      boundingBox: this.state.boundingBox,
      aggregationFlags,
      fp64
    });
    this.setState({
      weights,
      gridSize,
      gridOrigin,
      cellSize,
      boundingBox
    });
  }

  renderLayers() {
    if (!this.state.isSupported) {
      return null;
    }

    const {
      elevationScale,
      fp64,
      extruded,
      cellSize: cellSizeMeters,
      coverage,
      material,
      elevationRange,
      colorDomain,
      elevationDomain
    } = this.props;
    const {
      weights,
      gridSize,
      gridOrigin,
      cellSize
    } = this.state;
    const colorRange = (0, _colorUtils.colorRangeToFlatArray)(this.props.colorRange, Float32Array, 255);
    const SubLayerClass = this.getSubLayerClass('gpu-grid-cell', _gpuGridCellLayer.default);
    return new SubLayerClass({
      gridSize,
      gridOrigin,
      gridOffset: cellSize,
      colorRange,
      elevationRange,
      colorDomain,
      elevationDomain,
      fp64,
      cellSize: cellSizeMeters,
      coverage,
      material,
      elevationScale,
      extruded
    }, this.getSubLayerProps({
      id: 'gpu-grid-cell'
    }), {
      data: weights,
      numInstances: gridSize[0] * gridSize[1]
    });
  }

}

exports.default = GPUGridLayer;
GPUGridLayer.layerName = 'GPUGridLayer';
GPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=gpu-grid-layer.js.map