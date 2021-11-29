import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer, log } from 'kepler-outdated-deck.gl-core';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { AGGREGATION_OPERATION } from '../utils/aggregation-operation-utils';
import { pointToDensityGridData } from '../utils/gpu-grid-aggregation/grid-aggregation-utils';
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import GPUGridCellLayer from './gpu-grid-cell-layer';
import { pointToDensityGridDataCPU } from './../cpu-grid-layer/grid-aggregator';
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  colorDomain: null,
  colorRange: defaultColorRange,
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
export default class GPUGridLayer extends CompositeLayer {
  initializeState() {
    const {
      gl
    } = this.context;
    const isSupported = GPUGridAggregator.isSupported(gl);

    if (!isSupported) {
      log.error('GPUGridLayer is not supported on this browser, use GridLayer instead')();
    }

    const options = {
      id: "".concat(this.id, "-gpu-aggregator"),
      shaderCache: this.context.shaderCache
    };
    this.state = {
      gpuGridAggregator: new GPUGridAggregator(gl, options),
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
      const colorInfo = GPUGridAggregator.getAggregationData(Object.assign({
        pixelIndex: index
      }, gpuGridAggregator.getData('color')));
      const elevationInfo = GPUGridAggregator.getAggregationData(Object.assign({
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
          const cpuAggregation = pointToDensityGridDataCPU(data, this.props.cellSize, getPosition);
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
    const {
      weights,
      gridSize,
      gridOrigin,
      cellSize,
      boundingBox
    } = pointToDensityGridData({
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
    const colorRange = colorRangeToFlatArray(this.props.colorRange, Float32Array, 255);
    const SubLayerClass = this.getSubLayerClass('gpu-grid-cell', GPUGridCellLayer);
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
GPUGridLayer.layerName = 'GPUGridLayer';
GPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=gpu-grid-layer.js.map