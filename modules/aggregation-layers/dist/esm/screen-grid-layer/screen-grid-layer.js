import { Layer, WebMercatorViewport, createIterable, log, experimental } from 'kepler-outdated-deck.gl-core';
const {
  count
} = experimental;
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { AGGREGATION_OPERATION } from '../utils/aggregation-operation-utils';
import { Model, Geometry, Buffer, isWebGL2 } from 'kepler-outdated-luma.gl-core';
import vs from './screen-grid-layer-vertex.glsl';
import vs_WebGL1 from './screen-grid-layer-vertex-webgl1.glsl';
import fs from './screen-grid-layer-fragment.glsl';
import fs_WebGL1 from './screen-grid-layer-fragment-webgl1.glsl';
const DEFAULT_MINCOLOR = [0, 0, 0, 0];
const DEFAULT_MAXCOLOR = [0, 255, 0, 255];
const AGGREGATION_DATA_UBO_INDEX = 0;
const COLOR_PROPS = ["minColor", "maxColor", "colorRange", "colorDomain"];
const defaultProps = {
  cellSizePixels: {
    value: 100,
    min: 1
  },
  cellMarginPixels: {
    value: 2,
    min: 0,
    max: 5
  },
  colorDomain: null,
  colorRange: defaultColorRange,
  getPosition: {
    type: 'accessor',
    value: d => d.position
  },
  getWeight: {
    type: 'accessor',
    value: d => [1, 0, 0]
  },
  gpuAggregation: true,
  aggregation: 'SUM'
};
export default class ScreenGridLayer extends Layer {
  getShaders() {
    const shaders = isWebGL2(this.context.gl) ? {
      vs,
      fs
    } : {
      vs: vs_WebGL1,
      fs: fs_WebGL1
    };
    shaders.modules = ['picking'];
    return shaders;
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    const {
      gl
    } = this.context;
    attributeManager.addInstanced({
      instancePositions: {
        size: 3,
        update: this.calculateInstancePositions
      },
      instanceCounts: {
        size: 4,
        transition: true,
        accessor: ['getPosition', 'getWeight'],
        update: this.calculateInstanceCounts,
        noAlloc: true
      }
    });
    const options = {
      id: "".concat(this.id, "-aggregator"),
      shaderCache: this.context.shaderCache
    };

    const maxBuffer = this._getMaxCountBuffer(gl);

    const weights = {
      color: {
        size: 1,
        operation: AGGREGATION_OPERATION.SUM,
        needMax: true,
        maxBuffer
      }
    };
    this.setState({
      model: this._getModel(gl),
      gpuGridAggregator: new GPUGridAggregator(gl, options),
      maxBuffer,
      weights
    });

    this._setupUniformBuffer();
  }

  shouldUpdateState(_ref) {
    let {
      changeFlags
    } = _ref;
    return changeFlags.somethingChanged;
  }

  updateState(opts) {
    super.updateState(opts);

    this._updateUniforms(opts);

    if (opts.changeFlags.dataChanged) {
      this._processData();
    }

    const changeFlags = this._getAggregationChangeFlags(opts);

    if (changeFlags) {
      this._updateAggregation(changeFlags);
    }
  }

  finalizeState() {
    super.finalizeState();
    const {
      aggregationBuffer,
      maxBuffer,
      gpuGridAggregator
    } = this.state;
    gpuGridAggregator.delete();

    if (aggregationBuffer) {
      aggregationBuffer.delete();
    }

    if (maxBuffer) {
      maxBuffer.delete();
    }
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      gl
    } = this.context;
    const {
      parameters = {}
    } = this.props;
    const minColor = this.props.minColor || DEFAULT_MINCOLOR;
    const maxColor = this.props.maxColor || DEFAULT_MAXCOLOR;
    const colorDomain = this.props.colorDomain || [1, 0];
    const {
      model,
      maxBuffer,
      cellScale,
      shouldUseMinMax,
      colorRange,
      maxWeight
    } = this.state;
    const layerUniforms = {
      minColor,
      maxColor,
      cellScale,
      colorRange,
      colorDomain,
      shouldUseMinMax
    };

    if (isWebGL2(gl)) {
      maxBuffer.bind({
        target: 35345
      });
    } else {
      layerUniforms.maxWeight = maxWeight;
    }

    uniforms = Object.assign(layerUniforms, uniforms);
    model.draw({
      uniforms,
      parameters: Object.assign({
        depthTest: false,
        depthMask: false
      }, parameters)
    });

    if (isWebGL2(gl)) {
      maxBuffer.unbind();
    }
  }

  calculateInstancePositions(attribute, _ref3) {
    let {
      numInstances
    } = _ref3;
    const {
      width,
      height
    } = this.context.viewport;
    const {
      cellSizePixels
    } = this.props;
    const {
      numCol
    } = this.state;
    const {
      value,
      size
    } = attribute;

    for (let i = 0; i < numInstances; i++) {
      const x = i % numCol;
      const y = Math.floor(i / numCol);
      value[i * size + 0] = x * cellSizePixels / width * 2 - 1;
      value[i * size + 1] = 1 - y * cellSizePixels / height * 2;
      value[i * size + 2] = 0;
    }
  }

  calculateInstanceCounts(attribute, _ref4) {
    let {
      numInstances
    } = _ref4;
    const {
      aggregationBuffer
    } = this.state;
    attribute.update({
      buffer: aggregationBuffer
    });
  }

  getPickingInfo(_ref5) {
    let {
      info,
      mode
    } = _ref5;
    const {
      index
    } = info;

    if (index >= 0) {
      const {
        gpuGridAggregator
      } = this.state;
      const aggregationResults = gpuGridAggregator.getData('color');
      info.object = GPUGridAggregator.getAggregationData(Object.assign({
        pixelIndex: index
      }, aggregationResults));
    }

    return info;
  }

  _getAggregationChangeFlags(_ref6) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref6;
    const cellSizeChanged = props.cellSizePixels !== oldProps.cellSizePixels || props.cellMarginPixels !== oldProps.cellMarginPixels;
    const dataChanged = changeFlags.dataChanged || props.aggregation !== oldProps.aggregation;
    const viewportChanged = changeFlags.viewportChanged;

    if (cellSizeChanged || dataChanged || viewportChanged) {
      return {
        cellSizeChanged,
        dataChanged,
        viewportChanged
      };
    }

    return null;
  }

  _getModel(gl) {
    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        attributes: {
          positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  _getMaxCountBuffer(gl) {
    return new Buffer(gl, {
      byteLength: 4 * 4,
      index: AGGREGATION_DATA_UBO_INDEX,
      accessor: {
        size: 4
      }
    });
  }

  _processData() {
    const {
      data,
      getPosition,
      getWeight
    } = this.props;
    const pointCount = count(data);
    const positions = new Float64Array(pointCount * 2);
    const colorWeights = new Float32Array(pointCount * 3);
    const {
      weights
    } = this.state;
    const {
      iterable,
      objectInfo
    } = createIterable(data);

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      const weight = getWeight(object, objectInfo);
      const {
        index
      } = objectInfo;
      positions[index * 2] = position[0];
      positions[index * 2 + 1] = position[1];

      if (Array.isArray(weight)) {
        colorWeights[index * 3] = weight[0];
        colorWeights[index * 3 + 1] = weight[1];
        colorWeights[index * 3 + 2] = weight[2];
      } else {
        colorWeights[index * 3] = weight;
      }
    }

    weights.color.values = colorWeights;
    this.setState({
      positions
    });
  }

  _setupUniformBuffer() {
    const gl = this.context.gl;

    if (!isWebGL2(gl)) {
      return;
    }

    const programHandle = this.state.model.program.handle;
    const uniformBlockIndex = gl.getUniformBlockIndex(programHandle, 'AggregationData');
    gl.uniformBlockBinding(programHandle, uniformBlockIndex, AGGREGATION_DATA_UBO_INDEX);
  }

  _shouldUseMinMax() {
    const {
      minColor,
      maxColor,
      colorDomain,
      colorRange
    } = this.props;

    if (minColor || maxColor) {
      log.deprecated('ScreenGridLayer props: minColor and maxColor', 'colorRange, colorDomain')();
      return true;
    }

    if (colorDomain || colorRange) {
      return false;
    }

    return true;
  }

  _updateAggregation(changeFlags) {
    const attributeManager = this.getAttributeManager();

    if (changeFlags.cellSizeChanged || changeFlags.viewportChanged) {
      this._updateGridParams();

      attributeManager.invalidateAll();
    }

    const {
      cellSizePixels,
      gpuAggregation
    } = this.props;
    const {
      positions,
      weights
    } = this.state;
    const {
      viewport
    } = this.context;
    weights.color.operation = AGGREGATION_OPERATION[this.props.aggregation.toUpperCase()] || AGGREGATION_OPERATION.SUM;
    let projectPoints = false;
    let gridTransformMatrix = null;

    if (this.context.viewport instanceof WebMercatorViewport) {
      projectPoints = true;
    } else {
      projectPoints = false;
      gridTransformMatrix = viewport.pixelProjectionMatrix;
    }

    const results = this.state.gpuGridAggregator.run({
      positions,
      weights,
      cellSize: [cellSizePixels, cellSizePixels],
      viewport,
      changeFlags,
      useGPU: gpuAggregation,
      projectPoints,
      gridTransformMatrix
    });
    const maxWeight = results.color.maxData && Number.isFinite(results.color.maxData[0]) ? results.color.maxData[0] : 0;
    this.setState({
      maxWeight
    });
    attributeManager.invalidate('instanceCounts');
  }

  _updateUniforms(_ref7) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref7;
    const newState = {};

    if (COLOR_PROPS.some(key => oldProps[key] !== props[key])) {
      newState.shouldUseMinMax = this._shouldUseMinMax();
    }

    if (oldProps.colorRange !== props.colorRange) {
      newState.colorRange = colorRangeToFlatArray(props.colorRange, Float32Array, 255);
    }

    if (oldProps.cellMarginPixels !== props.cellMarginPixels || oldProps.cellSizePixels !== props.cellSizePixels || changeFlags.viewportChanged) {
      const {
        width,
        height
      } = this.context.viewport;
      const {
        cellSizePixels,
        cellMarginPixels
      } = this.props;
      const margin = cellSizePixels > cellMarginPixels ? cellMarginPixels : 0;
      newState.cellScale = new Float32Array([(cellSizePixels - margin) / width * 2, -(cellSizePixels - margin) / height * 2, 1]);
    }

    this.setState(newState);
  }

  _updateGridParams() {
    const {
      width,
      height
    } = this.context.viewport;
    const {
      cellSizePixels
    } = this.props;
    const {
      gl
    } = this.context;
    const numCol = Math.ceil(width / cellSizePixels);
    const numRow = Math.ceil(height / cellSizePixels);
    const numInstances = numCol * numRow;
    const dataBytes = numInstances * 4 * 4;
    let aggregationBuffer = this.state.aggregationBuffer;

    if (aggregationBuffer) {
      aggregationBuffer.delete();
    }

    aggregationBuffer = new Buffer(gl, {
      byteLength: dataBytes,
      accessor: {
        size: 4,
        type: 5126,
        divisor: 1
      }
    });
    this.state.weights.color.aggregationBuffer = aggregationBuffer;
    this.setState({
      numCol,
      numRow,
      numInstances,
      aggregationBuffer
    });
  }

}
ScreenGridLayer.layerName = 'ScreenGridLayer';
ScreenGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=screen-grid-layer.js.map