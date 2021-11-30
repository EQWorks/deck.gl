import { Buffer, Model, Transform, FEATURES, hasFeatures, isWebGL2, readPixelsToBuffer, fp64 as fp64Utils, withParameters } from 'kepler-outdated-luma.gl-core';
import { log } from 'kepler-outdated-deck.gl-core';
import { worldToPixels } from 'viewport-mercator-project';
const {
  fp64ifyMatrix4
} = fp64Utils;
import { DEFAULT_CHANGE_FLAGS, DEFAULT_RUN_PARAMS, MAX_32_BIT_FLOAT, MIN_BLEND_EQUATION, MAX_BLEND_EQUATION, MAX_MIN_BLEND_EQUATION, EQUATION_MAP, ELEMENTCOUNT, DEFAULT_WEIGHT_PARAMS, IDENTITY_MATRIX, PIXEL_SIZE, WEIGHT_SIZE } from './gpu-grid-aggregator-constants';
import { AGGREGATION_OPERATION } from '../aggregation-operation-utils';
import AGGREGATE_TO_GRID_VS from './aggregate-to-grid-vs.glsl';
import AGGREGATE_TO_GRID_VS_FP64 from './aggregate-to-grid-vs-64.glsl';
import AGGREGATE_TO_GRID_FS from './aggregate-to-grid-fs.glsl';
import AGGREGATE_ALL_VS_FP64 from './aggregate-all-vs-64.glsl';
import AGGREGATE_ALL_FS from './aggregate-all-fs.glsl';
import TRANSFORM_MEAN_VS from './transform-mean-vs.glsl';
import { getFloatTexture, getFramebuffer, getFloatArray } from './gpu-grid-aggregator-utils.js';
const BUFFER_NAMES = ['aggregationBuffer', 'maxMinBuffer', 'minBuffer', 'maxBuffer'];
const ARRAY_BUFFER_MAP = {
  maxData: 'maxBuffer',
  minData: 'minBuffer',
  maxMinData: 'maxMinBuffer'
};
export default class GPUGridAggregator {
  static getAggregationData(_ref) {
    let {
      aggregationData,
      maxData,
      minData,
      maxMinData,
      pixelIndex
    } = _ref;
    const index = pixelIndex * PIXEL_SIZE;
    const results = {};

    if (aggregationData) {
      results.cellCount = aggregationData[index + 3];
      results.cellWeight = aggregationData[index];
    }

    if (maxMinData) {
      results.maxCellWieght = maxMinData[0];
      results.minCellWeight = maxMinData[3];
    } else {
      if (maxData) {
        results.maxCellWieght = maxData[0];
        results.totalCount = maxData[3];
      }

      if (minData) {
        results.minCellWeight = minData[0];
        results.totalCount = maxData[3];
      }
    }

    return results;
  }

  static getCellData(_ref2) {
    let {
      countsData,
      size = 1
    } = _ref2;
    const numCells = countsData.length / 4;
    const cellWeights = new Float32Array(numCells * size);
    const cellCounts = new Uint32Array(numCells);

    for (let i = 0; i < numCells; i++) {
      for (let sizeIndex = 0; sizeIndex < size; sizeIndex++) {
        cellWeights[i * size + sizeIndex] = countsData[i * 4 + sizeIndex];
      }

      cellCounts[i] = countsData[i * 4 + 3];
    }

    return {
      cellCounts,
      cellWeights
    };
  }

  static isSupported(gl) {
    return isWebGL2(gl) && hasFeatures(gl, FEATURES.BLEND_EQUATION_MINMAX, FEATURES.COLOR_ATTACHMENT_RGBA32F, FEATURES.TEXTURE_FLOAT);
  }

  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.id = opts.id || 'gpu-grid-aggregator';
    this.shaderCache = opts.shaderCache || null;
    this.gl = gl;
    this.state = {
      weights: null,
      gridPositions: null,
      positionsBuffer: null,
      positions64xyLowBuffer: null,
      vertexCount: 0,
      fp64: null,
      useGPU: null,
      numCol: 0,
      numRow: 0,
      windowSize: null,
      cellSize: null,
      weightAttributes: {},
      textures: {},
      meanTextures: {},
      buffers: {},
      framebuffers: {},
      maxMinFramebuffers: {},
      minFramebuffers: {},
      maxFramebuffers: {},
      equations: {},
      resources: {},
      results: {}
    };
    this._hasGPUSupport = isWebGL2(gl) && hasFeatures(this.gl, FEATURES.BLEND_EQUATION_MINMAX, FEATURES.COLOR_ATTACHMENT_RGBA32F, FEATURES.TEXTURE_FLOAT);
  }

  delete() {
    const {
      gridAggregationModel,
      allAggregationModel,
      meanTransform
    } = this;
    const {
      positionsBuffer,
      positions64xyLowBuffer,
      textures,
      framebuffers,
      maxMinFramebuffers,
      minFramebuffers,
      maxFramebuffers,
      meanTextures,
      resources
    } = this.state;
    gridAggregationModel && gridAggregationModel.delete();
    allAggregationModel && allAggregationModel.delete();
    meanTransform && meanTransform.delete();
    positionsBuffer && positionsBuffer.delete();
    positions64xyLowBuffer && positions64xyLowBuffer.delete();
    this.deleteResources([framebuffers, textures, maxMinFramebuffers, minFramebuffers, maxFramebuffers, meanTextures, resources]);
  }

  run() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.setState({
      results: {}
    });
    const aggregationParams = this.getAggregationParams(opts);
    this.updateGridSize(aggregationParams);
    const {
      useGPU
    } = aggregationParams;

    if (this._hasGPUSupport && useGPU) {
      return this.runAggregationOnGPU(aggregationParams);
    }

    if (useGPU) {
      log.info('GPUGridAggregator: GPU Aggregation not supported, falling back to CPU')();
    }

    return this.runAggregationOnCPU(aggregationParams);
  }

  getData(weightId) {
    const data = {};
    const results = this.state.results;

    if (!results[weightId].aggregationData) {
      results[weightId].aggregationData = results[weightId].aggregationBuffer.getData();
    }

    data.aggregationData = results[weightId].aggregationData;

    for (const arrayName in ARRAY_BUFFER_MAP) {
      const bufferName = ARRAY_BUFFER_MAP[arrayName];

      if (results[weightId][arrayName] || results[weightId][bufferName]) {
        results[weightId][arrayName] = results[weightId][arrayName] || results[weightId][bufferName].getData();
        data[arrayName] = results[weightId][arrayName];
      }
    }

    return data;
  }

  deleteResources(resources) {
    resources = Array.isArray(resources) ? resources : [resources];
    resources.forEach(obj => {
      for (const name in obj) {
        obj[name].delete();
      }
    });
  }

  getAggregationParams(opts) {
    const aggregationParams = Object.assign({}, DEFAULT_RUN_PARAMS, opts);
    const {
      useGPU,
      gridTransformMatrix,
      viewport,
      weights,
      projectPoints,
      cellSize
    } = aggregationParams;

    if (this.state.useGPU !== useGPU) {
      aggregationParams.changeFlags = Object.assign({}, aggregationParams.changeFlags, DEFAULT_CHANGE_FLAGS);
    }

    if (cellSize && (!this.state.cellSize || this.state.cellSize[0] !== cellSize[0] || this.state.cellSize[1] !== cellSize[1])) {
      aggregationParams.changeFlags.cellSizeChanged = true;
      this.setState({
        cellSize
      });
    }

    this.validateProps(aggregationParams, opts);
    this.setState({
      useGPU
    });
    aggregationParams.gridTransformMatrix = (projectPoints ? viewport.viewportMatrix : gridTransformMatrix) || IDENTITY_MATRIX;

    if (weights) {
      aggregationParams.weights = this.normalizeWeightParams(weights);
      this.setState({
        weights: aggregationParams.weights
      });
    }

    return aggregationParams;
  }

  normalizeWeightParams(weights) {
    const result = {};

    for (const id in weights) {
      result[id] = Object.assign({}, DEFAULT_WEIGHT_PARAMS, weights[id]);
    }

    return result;
  }

  setState(updateObject) {
    Object.assign(this.state, updateObject);
  }

  shouldTransformToGrid(opts) {
    const {
      projectPoints,
      changeFlags
    } = opts;

    if (!this.state.gridPositions || changeFlags.dataChanged || projectPoints && changeFlags.viewportChanged) {
      return true;
    }

    return false;
  }

  updateGridSize(opts) {
    const {
      viewport,
      cellSize
    } = opts;
    const width = opts.width || viewport.width;
    const height = opts.height || viewport.height;
    const numCol = Math.ceil(width / cellSize[0]);
    const numRow = Math.ceil(height / cellSize[1]);
    this.setState({
      numCol,
      numRow,
      windowSize: [width, height]
    });
  }

  validateProps(aggregationParams, opts) {
    const {
      changeFlags,
      projectPoints,
      gridTransformMatrix
    } = aggregationParams;
    log.assert(changeFlags.dataChanged || changeFlags.viewportChanged || changeFlags.cellSizeChanged);
    log.assert(!changeFlags.dataChanged || opts.positions && opts.weights && (!opts.projectPositions || opts.viewport) && opts.cellSize);
    log.assert(!changeFlags.cellSizeChanged || opts.cellSize);
    log.assert(!(changeFlags.viewportChanged && projectPoints) || opts.viewport);

    if (projectPoints && gridTransformMatrix) {
      log.warn('projectPoints is true, gridTransformMatrix is ignored')();
    }
  }

  calculateAggregationData(opts) {
    const {
      weights,
      results,
      cellIndex,
      posIndex
    } = opts;

    for (const id in weights) {
      const {
        values,
        size,
        operation
      } = weights[id];
      const {
        aggregationData
      } = results[id];

      for (let sizeIndex = 0; sizeIndex < size; sizeIndex++) {
        const cellElementIndex = cellIndex + sizeIndex;
        const weightComponent = values[posIndex * WEIGHT_SIZE + sizeIndex];

        if (aggregationData[cellIndex + 3] === 0) {
          aggregationData[cellElementIndex] = weightComponent;
        } else {
          switch (operation) {
            case AGGREGATION_OPERATION.SUM:
            case AGGREGATION_OPERATION.MEAN:
              aggregationData[cellElementIndex] += weightComponent;
              break;

            case AGGREGATION_OPERATION.MIN:
              aggregationData[cellElementIndex] = Math.min(aggregationData[cellElementIndex], weightComponent);
              break;

            case AGGREGATION_OPERATION.MAX:
              aggregationData[cellElementIndex] = Math.max(aggregationData[cellElementIndex], weightComponent);
              break;

            default:
              log.assert(false);
              break;
          }
        }
      }

      aggregationData[cellIndex + 3]++;
    }
  }

  calculateMeanMaxMinData(opts) {
    const {
      validCellIndices,
      results,
      weights
    } = opts;
    validCellIndices.forEach(cellIndex => {
      for (const id in results) {
        const {
          size,
          needMin,
          needMax,
          operation
        } = weights[id];
        const {
          aggregationData,
          minData,
          maxData,
          maxMinData
        } = results[id];
        const calculateMinMax = needMin || needMax;
        const calculateMean = operation === AGGREGATION_OPERATION.MEAN;
        const combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
        const count = aggregationData[cellIndex + ELEMENTCOUNT - 1];

        for (let sizeIndex = 0; sizeIndex < size && (calculateMinMax || calculateMean); sizeIndex++) {
          const cellElementIndex = cellIndex + sizeIndex;
          let weight = aggregationData[cellElementIndex];

          if (calculateMean) {
            aggregationData[cellElementIndex] /= count;
            weight = aggregationData[cellElementIndex];
          }

          if (combineMaxMin) {
            maxMinData[sizeIndex] = Math.max(maxMinData[sizeIndex], weight);
          } else {
            if (needMin) {
              minData[sizeIndex] = Math.min(minData[sizeIndex], weight);
            }

            if (needMax) {
              maxData[sizeIndex] = Math.max(maxData[sizeIndex], weight);
            }
          }
        }

        if (combineMaxMin) {
          maxMinData[ELEMENTCOUNT - 1] = Math.min(maxMinData[ELEMENTCOUNT - 1], aggregationData[cellIndex + 0]);
        } else {
          if (needMin) {
            minData[ELEMENTCOUNT - 1] += count;
          }

          if (needMax) {
            maxData[ELEMENTCOUNT - 1] += count;
          }
        }
      }
    });
  }

  initCPUResults(opts) {
    const weights = opts.weights || this.state.weights;
    const {
      numCol,
      numRow
    } = this.state;
    const results = {};

    for (const id in weights) {
      let {
        aggregationData,
        minData,
        maxData,
        maxMinData
      } = weights[id];
      const {
        needMin,
        needMax
      } = weights[id];
      const combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
      const aggregationSize = numCol * numRow * ELEMENTCOUNT;
      aggregationData = getFloatArray(aggregationData, aggregationSize);

      if (combineMaxMin) {
        maxMinData = getFloatArray(maxMinData, ELEMENTCOUNT);
        maxMinData.fill(-Infinity, 0, ELEMENTCOUNT - 1);
        maxMinData[ELEMENTCOUNT - 1] = Infinity;
      } else {
        if (needMin) {
          minData = getFloatArray(minData, ELEMENTCOUNT, Infinity);
          minData[ELEMENTCOUNT - 1] = 0;
        }

        if (needMax) {
          maxData = getFloatArray(maxData, ELEMENTCOUNT, -Infinity);
          maxData[ELEMENTCOUNT - 1] = 0;
        }
      }

      results[id] = Object.assign({}, weights[id], {
        aggregationData,
        minData,
        maxData,
        maxMinData
      });
    }

    return results;
  }

  runAggregationOnCPU(opts) {
    const {
      positions,
      cellSize,
      gridTransformMatrix,
      viewport,
      projectPoints
    } = opts;
    let {
      weights
    } = opts;
    const {
      numCol,
      numRow
    } = this.state;
    const results = this.initCPUResults(opts);
    const gridTransformRequired = this.shouldTransformToGrid(opts);
    let gridPositions;
    const pos = [0, 0, 0];
    log.assert(gridTransformRequired || opts.changeFlags.cellSizeChanged);
    let posCount;

    if (gridTransformRequired) {
      posCount = positions.length / 2;
      gridPositions = new Float64Array(positions.length);
      this.setState({
        gridPositions
      });
    } else {
      gridPositions = this.state.gridPositions;
      weights = this.state.weights;
      posCount = gridPositions.length / 2;
    }

    const validCellIndices = new Set();

    for (let posIndex = 0; posIndex < posCount; posIndex++) {
      let x;
      let y;

      if (gridTransformRequired) {
        pos[0] = positions[posIndex * 2];
        pos[1] = positions[posIndex * 2 + 1];

        if (projectPoints) {
          [x, y] = viewport.project(pos);
        } else {
          [x, y] = worldToPixels(pos, gridTransformMatrix);
        }

        gridPositions[posIndex * 2] = x;
        gridPositions[posIndex * 2 + 1] = y;
      } else {
        x = gridPositions[posIndex * 2];
        y = gridPositions[posIndex * 2 + 1];
      }

      const colId = Math.floor(x / cellSize[0]);
      const rowId = Math.floor(y / cellSize[1]);

      if (colId >= 0 && colId < numCol && rowId >= 0 && rowId < numRow) {
        const cellIndex = (colId + rowId * numCol) * ELEMENTCOUNT;
        validCellIndices.add(cellIndex);
        this.calculateAggregationData({
          weights,
          results,
          cellIndex,
          posIndex
        });
      }
    }

    this.calculateMeanMaxMinData({
      validCellIndices,
      results,
      weights
    });
    this.updateAggregationBuffers(opts, results);
    this.setState({
      results
    });
    return results;
  }

  updateCPUResultBuffer(_ref3) {
    let {
      gl,
      bufferName,
      id,
      data,
      result
    } = _ref3;
    const {
      resources
    } = this.state;
    const resourceName = "cpu-result-".concat(id, "-").concat(bufferName);
    result[bufferName] = result[bufferName] || resources[resourceName];

    if (result[bufferName]) {
      result[bufferName].setData({
        data
      });
    } else {
      resources[resourceName] = new Buffer(gl, data);
      result[bufferName] = resources[resourceName];
    }
  }

  updateAggregationBuffers(opts, results) {
    if (!opts.createBufferObjects) {
      return;
    }

    const weights = opts.weights || this.state.weights;

    for (const id in results) {
      const {
        aggregationData,
        minData,
        maxData,
        maxMinData
      } = results[id];
      const {
        needMin,
        needMax
      } = weights[id];
      const combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
      this.updateCPUResultBuffer({
        gl: this.gl,
        bufferName: 'aggregationBuffer',
        id,
        data: aggregationData,
        result: results[id]
      });

      if (combineMaxMin) {
        this.updateCPUResultBuffer({
          gl: this.gl,
          bufferName: 'maxMinBuffer',
          id,
          data: maxMinData,
          result: results[id]
        });
      } else {
        if (needMin) {
          this.updateCPUResultBuffer({
            gl: this.gl,
            bufferName: 'minBuffer',
            id,
            data: minData,
            result: results[id]
          });
        }

        if (needMax) {
          this.updateCPUResultBuffer({
            gl: this.gl,
            bufferName: 'maxBuffer',
            id,
            data: maxData,
            result: results[id]
          });
        }
      }
    }
  }

  getAggregateData(opts) {
    const results = {};
    const {
      textures,
      framebuffers,
      maxMinFramebuffers,
      minFramebuffers,
      maxFramebuffers,
      weights
    } = this.state;

    for (const id in weights) {
      results[id] = {};
      const {
        needMin,
        needMax,
        combineMaxMin
      } = weights[id];
      results[id].aggregationTexture = textures[id];
      results[id].aggregationBuffer = readPixelsToBuffer(framebuffers[id], {
        target: weights[id].aggregationBuffer,
        sourceType: 5126
      });

      if (needMin && needMax && combineMaxMin) {
        results[id].maxMinBuffer = readPixelsToBuffer(maxMinFramebuffers[id], {
          target: weights[id].maxMinBuffer,
          sourceType: 5126
        });
      } else {
        if (needMin) {
          results[id].minBuffer = readPixelsToBuffer(minFramebuffers[id], {
            target: weights[id].minBuffer,
            sourceType: 5126
          });
        }

        if (needMax) {
          results[id].maxBuffer = readPixelsToBuffer(maxFramebuffers[id], {
            target: weights[id].maxBuffer,
            sourceType: 5126
          });
        }
      }
    }

    this.trackGPUResultBuffers(results, weights);
    return results;
  }

  getAggregationModel() {
    let fp64 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    const {
      gl,
      shaderCache
    } = this;
    return new Model(gl, {
      id: 'Gird-Aggregation-Model',
      vs: fp64 ? AGGREGATE_TO_GRID_VS_FP64 : AGGREGATE_TO_GRID_VS,
      fs: AGGREGATE_TO_GRID_FS,
      modules: fp64 ? ['fp64', 'project64'] : ['project32'],
      shaderCache,
      vertexCount: 0,
      drawMode: 0
    });
  }

  getAllAggregationModel() {
    const {
      gl,
      shaderCache
    } = this;
    const {
      numCol,
      numRow
    } = this.state;
    return new Model(gl, {
      id: 'All-Aggregation-Model',
      vs: AGGREGATE_ALL_VS_FP64,
      fs: AGGREGATE_ALL_FS,
      modules: ['fp64'],
      shaderCache,
      vertexCount: 1,
      drawMode: 0,
      isInstanced: true,
      instanceCount: numCol * numRow,
      attributes: {
        position: [0, 0]
      }
    });
  }

  getMeanTransform(opts) {
    if (this.meanTransform) {
      this.meanTransform.update(opts);
    } else {
      this.meanTransform = new Transform(this.gl, Object.assign({}, {
        vs: TRANSFORM_MEAN_VS,
        _targetTextureVarying: 'meanValues'
      }, opts));
    }

    return this.meanTransform;
  }

  renderAggregateData(opts) {
    const {
      cellSize,
      viewport,
      gridTransformMatrix,
      projectPoints
    } = opts;
    const {
      numCol,
      numRow,
      windowSize,
      maxMinFramebuffers,
      minFramebuffers,
      maxFramebuffers,
      weights
    } = this.state;
    const uProjectionMatrixFP64 = fp64ifyMatrix4(gridTransformMatrix);
    const gridSize = [numCol, numRow];
    const parameters = {
      blend: true,
      depthTest: false,
      blendFunc: [1, 1]
    };
    const moduleSettings = {
      viewport
    };
    const uniforms = {
      windowSize,
      cellSize,
      gridSize,
      uProjectionMatrix: gridTransformMatrix,
      uProjectionMatrixFP64,
      projectPoints
    };

    for (const id in weights) {
      const {
        needMin,
        needMax
      } = weights[id];
      const combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
      this.renderToWeightsTexture({
        id,
        parameters,
        moduleSettings,
        uniforms,
        gridSize
      });

      if (combineMaxMin) {
        this.renderToMaxMinTexture({
          id,
          parameters: Object.assign({}, parameters, {
            blendEquation: MAX_MIN_BLEND_EQUATION
          }),
          gridSize,
          minOrMaxFb: maxMinFramebuffers[id],
          clearParams: {
            clearColor: [0, 0, 0, MAX_32_BIT_FLOAT]
          },
          combineMaxMin
        });
      } else {
        if (needMin) {
          this.renderToMaxMinTexture({
            id,
            parameters: Object.assign({}, parameters, {
              blendEquation: MIN_BLEND_EQUATION
            }),
            gridSize,
            minOrMaxFb: minFramebuffers[id],
            clearParams: {
              clearColor: [MAX_32_BIT_FLOAT, MAX_32_BIT_FLOAT, MAX_32_BIT_FLOAT, 0]
            },
            combineMaxMin
          });
        }

        if (needMax) {
          this.renderToMaxMinTexture({
            id,
            parameters: Object.assign({}, parameters, {
              blendEquation: MAX_BLEND_EQUATION
            }),
            gridSize,
            minOrMaxFb: maxFramebuffers[id],
            combineMaxMin
          });
        }
      }
    }
  }

  renderToMaxMinTexture(opts) {
    const {
      id,
      parameters,
      gridSize,
      minOrMaxFb,
      combineMaxMin,
      clearParams = {}
    } = opts;
    const {
      framebuffers
    } = this.state;
    const {
      gl,
      allAggregationModel
    } = this;
    minOrMaxFb.bind();
    gl.viewport(0, 0, gridSize[0], gridSize[1]);
    withParameters(gl, clearParams, () => {
      gl.clear(16384);
    });
    allAggregationModel.draw({
      parameters,
      uniforms: {
        uSampler: framebuffers[id].texture,
        gridSize,
        combineMaxMin
      }
    });
    minOrMaxFb.unbind();
  }

  renderToWeightsTexture(opts) {
    const {
      id,
      parameters,
      moduleSettings,
      uniforms,
      gridSize
    } = opts;
    const {
      framebuffers,
      equations,
      weightAttributes,
      weights
    } = this.state;
    const {
      gl,
      gridAggregationModel
    } = this;
    const {
      operation
    } = weights[id];
    framebuffers[id].bind();
    gl.viewport(0, 0, gridSize[0], gridSize[1]);
    const clearColor = operation === AGGREGATION_OPERATION.MIN ? [MAX_32_BIT_FLOAT, MAX_32_BIT_FLOAT, MAX_32_BIT_FLOAT, 0] : [0, 0, 0, 0];
    withParameters(gl, {
      clearColor
    }, () => {
      gl.clear(16384);
    });
    const attributes = {
      weights: weightAttributes[id]
    };
    gridAggregationModel.draw({
      parameters: Object.assign({}, parameters, {
        blendEquation: equations[id]
      }),
      moduleSettings,
      uniforms,
      attributes
    });
    framebuffers[id].unbind();

    if (operation === AGGREGATION_OPERATION.MEAN) {
      const {
        meanTextures,
        textures
      } = this.state;
      const transformOptions = {
        _sourceTextures: {
          aggregationValues: meanTextures[id]
        },
        _targetTexture: textures[id],
        elementCount: textures[id].width * textures[id].height
      };
      const meanTransform = this.getMeanTransform(transformOptions);
      meanTransform.run({
        parameters: {
          blend: false,
          depthTest: false
        }
      });
      framebuffers[id].attach({
        [36064]: textures[id]
      });
    }
  }

  runAggregationOnGPU(opts) {
    this.updateModels(opts);
    this.setupFramebuffers(opts);
    this.renderAggregateData(opts);
    const results = this.getAggregateData(opts);
    this.setState({
      results
    });
    return results;
  }

  setupFramebuffers(opts) {
    const {
      numCol,
      numRow,
      textures,
      framebuffers,
      maxMinFramebuffers,
      minFramebuffers,
      maxFramebuffers,
      resources,
      meanTextures,
      equations,
      weights
    } = this.state;
    const framebufferSize = {
      width: numCol,
      height: numRow
    };

    for (const id in weights) {
      const {
        needMin,
        needMax,
        combineMaxMin,
        operation
      } = weights[id];
      textures[id] = weights[id].aggregationTexture || textures[id] || getFloatTexture(this.gl, {
        id: "".concat(id, "-texture"),
        width: numCol,
        height: numRow
      });
      textures[id].resize(framebufferSize);
      let texture = textures[id];

      if (operation === AGGREGATION_OPERATION.MEAN) {
        meanTextures[id] = meanTextures[id] || getFloatTexture(this.gl, {
          id: "".concat(id, "-mean-texture"),
          width: numCol,
          height: numRow
        });
        meanTextures[id].resize(framebufferSize);
        texture = meanTextures[id];
      }

      if (framebuffers[id]) {
        framebuffers[id].attach({
          [36064]: texture
        });
      } else {
        framebuffers[id] = getFramebuffer(this.gl, {
          id: "".concat(id, "-fb"),
          width: numCol,
          height: numRow,
          texture
        });
      }

      framebuffers[id].resize(framebufferSize);
      equations[id] = EQUATION_MAP[operation];

      if (needMin || needMax) {
        if (needMin && needMax && combineMaxMin) {
          if (!maxMinFramebuffers[id]) {
            resources["".concat(id, "-maxMin")] = getFloatTexture(this.gl, {
              id: "".concat(id, "-maxMinTex")
            });
            maxMinFramebuffers[id] = getFramebuffer(this.gl, {
              id: "".concat(id, "-maxMinFb"),
              texture: resources["".concat(id, "-maxMin")]
            });
          }
        } else {
          if (needMin) {
            if (!minFramebuffers[id]) {
              resources["".concat(id, "-min")] = getFloatTexture(this.gl, {
                id: "".concat(id, "-minTex")
              });
              minFramebuffers[id] = getFramebuffer(this.gl, {
                id: "".concat(id, "-minFb"),
                texture: resources["".concat(id, "-min")]
              });
            }
          }

          if (needMax) {
            if (!maxFramebuffers[id]) {
              resources["".concat(id, "-max")] = getFloatTexture(this.gl, {
                id: "".concat(id, "-maxTex")
              });
              maxFramebuffers[id] = getFramebuffer(this.gl, {
                id: "".concat(id, "-maxFb"),
                texture: resources["".concat(id, "-max")]
              });
            }
          }
        }
      }
    }
  }

  setupModels() {
    let fp64 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (this.gridAggregationModel) {
      this.gridAggregationModel.delete();
    }

    this.gridAggregationModel = this.getAggregationModel(fp64);

    if (!this.allAggregationModel) {
      this.allAggregationModel = this.getAllAggregationModel();
    }
  }

  setupWeightAttributes(opts) {
    const {
      weightAttributes,
      vertexCount,
      weights,
      resources
    } = this.state;

    for (const id in weights) {
      const {
        values
      } = weights[id];

      if (Array.isArray(values) || values.constructor === Float32Array) {
        log.assert(values.length / 3 === vertexCount);
        const typedArray = Array.isArray(values) ? new Float32Array(values) : values;

        if (weightAttributes[id] instanceof Buffer) {
          weightAttributes[id].setData(typedArray);
        } else {
          resources["".concat(id, "-buffer")] = new Buffer(this.gl, typedArray);
          weightAttributes[id] = resources["".concat(id, "-buffer")];
        }
      } else {
        log.assert(values instanceof Buffer);
        weightAttributes[id] = values;
      }
    }
  }

  trackGPUResultBuffers(results, weights) {
    const {
      resources
    } = this.state;

    for (const id in results) {
      if (results[id]) {
        for (const bufferName of BUFFER_NAMES) {
          if (results[id][bufferName] && weights[id][bufferName] !== results[id][bufferName]) {
            const name = "gpu-result-".concat(id, "-").concat(bufferName);

            if (resources[name]) {
              resources[name].delete();
            }

            resources[name] = results[id][bufferName];
          }
        }
      }
    }
  }

  updateModels(opts) {
    const {
      gl
    } = this;
    const {
      positions,
      positions64xyLow,
      changeFlags
    } = opts;
    const {
      numCol,
      numRow
    } = this.state;
    const aggregationModelAttributes = {};
    let modelDirty = false;

    if (opts.fp64 !== this.state.fp64) {
      this.setupModels(opts.fp64);
      this.setState({
        fp64: opts.fp64
      });
      modelDirty = true;
    }

    if (changeFlags.dataChanged || !this.state.positionsBuffer) {
      let {
        positionsBuffer,
        positions64xyLowBuffer
      } = this.state;

      if (positionsBuffer) {
        positionsBuffer.delete();
      }

      if (positions64xyLowBuffer) {
        positions64xyLowBuffer.delete();
      }

      const vertexCount = positions.length / 2;
      positionsBuffer = new Buffer(gl, new Float32Array(positions));
      positions64xyLowBuffer = new Buffer(gl, {
        data: new Float32Array(positions64xyLow),
        accessor: {
          size: 2
        }
      });
      this.setState({
        positionsBuffer,
        positions64xyLowBuffer,
        vertexCount
      });
      this.setupWeightAttributes(opts);
      modelDirty = true;
    }

    if (modelDirty) {
      const {
        vertexCount,
        positionsBuffer,
        positions64xyLowBuffer
      } = this.state;
      aggregationModelAttributes.positions = positionsBuffer;

      if (opts.fp64) {
        aggregationModelAttributes.positions64xyLow = positions64xyLowBuffer;
      }

      this.gridAggregationModel.setVertexCount(vertexCount);
      this.gridAggregationModel.setAttributes(aggregationModelAttributes);
    }

    if (changeFlags.cellSizeChanged || changeFlags.viewportChanged) {
      this.allAggregationModel.setInstanceCount(numCol * numRow);
    }
  }

}
//# sourceMappingURL=gpu-grid-aggregator.js.map