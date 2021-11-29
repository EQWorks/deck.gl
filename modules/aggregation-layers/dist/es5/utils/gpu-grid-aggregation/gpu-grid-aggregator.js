"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@luma.gl/core");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _viewportMercatorProject = require("viewport-mercator-project");

var _gpuGridAggregatorConstants = require("./gpu-grid-aggregator-constants");

var _aggregationOperationUtils = require("../aggregation-operation-utils");

var _aggregateToGridVs = _interopRequireDefault(require("./aggregate-to-grid-vs.glsl"));

var _aggregateToGridVs2 = _interopRequireDefault(require("./aggregate-to-grid-vs-64.glsl"));

var _aggregateToGridFs = _interopRequireDefault(require("./aggregate-to-grid-fs.glsl"));

var _aggregateAllVs = _interopRequireDefault(require("./aggregate-all-vs-64.glsl"));

var _aggregateAllFs = _interopRequireDefault(require("./aggregate-all-fs.glsl"));

var _transformMeanVs = _interopRequireDefault(require("./transform-mean-vs.glsl"));

var _gpuGridAggregatorUtils = require("./gpu-grid-aggregator-utils.js");

var fp64ifyMatrix4 = _core.fp64.fp64ifyMatrix4;
var BUFFER_NAMES = ['aggregationBuffer', 'maxMinBuffer', 'minBuffer', 'maxBuffer'];
var ARRAY_BUFFER_MAP = {
  maxData: 'maxBuffer',
  minData: 'minBuffer',
  maxMinData: 'maxMinBuffer'
};

var GPUGridAggregator = function () {
  (0, _createClass2.default)(GPUGridAggregator, null, [{
    key: "getAggregationData",
    value: function getAggregationData(_ref) {
      var aggregationData = _ref.aggregationData,
          maxData = _ref.maxData,
          minData = _ref.minData,
          maxMinData = _ref.maxMinData,
          pixelIndex = _ref.pixelIndex;
      var index = pixelIndex * _gpuGridAggregatorConstants.PIXEL_SIZE;
      var results = {};

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
  }, {
    key: "getCellData",
    value: function getCellData(_ref2) {
      var countsData = _ref2.countsData,
          _ref2$size = _ref2.size,
          size = _ref2$size === void 0 ? 1 : _ref2$size;
      var numCells = countsData.length / 4;
      var cellWeights = new Float32Array(numCells * size);
      var cellCounts = new Uint32Array(numCells);

      for (var i = 0; i < numCells; i++) {
        for (var sizeIndex = 0; sizeIndex < size; sizeIndex++) {
          cellWeights[i * size + sizeIndex] = countsData[i * 4 + sizeIndex];
        }

        cellCounts[i] = countsData[i * 4 + 3];
      }

      return {
        cellCounts: cellCounts,
        cellWeights: cellWeights
      };
    }
  }, {
    key: "isSupported",
    value: function isSupported(gl) {
      return (0, _core.isWebGL2)(gl) && (0, _core.hasFeatures)(gl, _core.FEATURES.BLEND_EQUATION_MINMAX, _core.FEATURES.COLOR_ATTACHMENT_RGBA32F, _core.FEATURES.TEXTURE_FLOAT);
    }
  }]);

  function GPUGridAggregator(gl) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2.default)(this, GPUGridAggregator);
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
    this._hasGPUSupport = (0, _core.isWebGL2)(gl) && (0, _core.hasFeatures)(this.gl, _core.FEATURES.BLEND_EQUATION_MINMAX, _core.FEATURES.COLOR_ATTACHMENT_RGBA32F, _core.FEATURES.TEXTURE_FLOAT);
  }

  (0, _createClass2.default)(GPUGridAggregator, [{
    key: "delete",
    value: function _delete() {
      var gridAggregationModel = this.gridAggregationModel,
          allAggregationModel = this.allAggregationModel,
          meanTransform = this.meanTransform;
      var _this$state = this.state,
          positionsBuffer = _this$state.positionsBuffer,
          positions64xyLowBuffer = _this$state.positions64xyLowBuffer,
          textures = _this$state.textures,
          framebuffers = _this$state.framebuffers,
          maxMinFramebuffers = _this$state.maxMinFramebuffers,
          minFramebuffers = _this$state.minFramebuffers,
          maxFramebuffers = _this$state.maxFramebuffers,
          meanTextures = _this$state.meanTextures,
          resources = _this$state.resources;
      gridAggregationModel && gridAggregationModel.delete();
      allAggregationModel && allAggregationModel.delete();
      meanTransform && meanTransform.delete();
      positionsBuffer && positionsBuffer.delete();
      positions64xyLowBuffer && positions64xyLowBuffer.delete();
      this.deleteResources([framebuffers, textures, maxMinFramebuffers, minFramebuffers, maxFramebuffers, meanTextures, resources]);
    }
  }, {
    key: "run",
    value: function run() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.setState({
        results: {}
      });
      var aggregationParams = this.getAggregationParams(opts);
      this.updateGridSize(aggregationParams);
      var useGPU = aggregationParams.useGPU;

      if (this._hasGPUSupport && useGPU) {
        return this.runAggregationOnGPU(aggregationParams);
      }

      if (useGPU) {
        _keplerOutdatedDeck.log.info('GPUGridAggregator: GPU Aggregation not supported, falling back to CPU')();
      }

      return this.runAggregationOnCPU(aggregationParams);
    }
  }, {
    key: "getData",
    value: function getData(weightId) {
      var data = {};
      var results = this.state.results;

      if (!results[weightId].aggregationData) {
        results[weightId].aggregationData = results[weightId].aggregationBuffer.getData();
      }

      data.aggregationData = results[weightId].aggregationData;

      for (var arrayName in ARRAY_BUFFER_MAP) {
        var bufferName = ARRAY_BUFFER_MAP[arrayName];

        if (results[weightId][arrayName] || results[weightId][bufferName]) {
          results[weightId][arrayName] = results[weightId][arrayName] || results[weightId][bufferName].getData();
          data[arrayName] = results[weightId][arrayName];
        }
      }

      return data;
    }
  }, {
    key: "deleteResources",
    value: function deleteResources(resources) {
      resources = Array.isArray(resources) ? resources : [resources];
      resources.forEach(function (obj) {
        for (var name in obj) {
          obj[name].delete();
        }
      });
    }
  }, {
    key: "getAggregationParams",
    value: function getAggregationParams(opts) {
      var aggregationParams = Object.assign({}, _gpuGridAggregatorConstants.DEFAULT_RUN_PARAMS, opts);
      var useGPU = aggregationParams.useGPU,
          gridTransformMatrix = aggregationParams.gridTransformMatrix,
          viewport = aggregationParams.viewport,
          weights = aggregationParams.weights,
          projectPoints = aggregationParams.projectPoints,
          cellSize = aggregationParams.cellSize;

      if (this.state.useGPU !== useGPU) {
        aggregationParams.changeFlags = Object.assign({}, aggregationParams.changeFlags, _gpuGridAggregatorConstants.DEFAULT_CHANGE_FLAGS);
      }

      if (cellSize && (!this.state.cellSize || this.state.cellSize[0] !== cellSize[0] || this.state.cellSize[1] !== cellSize[1])) {
        aggregationParams.changeFlags.cellSizeChanged = true;
        this.setState({
          cellSize: cellSize
        });
      }

      this.validateProps(aggregationParams, opts);
      this.setState({
        useGPU: useGPU
      });
      aggregationParams.gridTransformMatrix = (projectPoints ? viewport.viewportMatrix : gridTransformMatrix) || _gpuGridAggregatorConstants.IDENTITY_MATRIX;

      if (weights) {
        aggregationParams.weights = this.normalizeWeightParams(weights);
        this.setState({
          weights: aggregationParams.weights
        });
      }

      return aggregationParams;
    }
  }, {
    key: "normalizeWeightParams",
    value: function normalizeWeightParams(weights) {
      var result = {};

      for (var id in weights) {
        result[id] = Object.assign({}, _gpuGridAggregatorConstants.DEFAULT_WEIGHT_PARAMS, weights[id]);
      }

      return result;
    }
  }, {
    key: "setState",
    value: function setState(updateObject) {
      Object.assign(this.state, updateObject);
    }
  }, {
    key: "shouldTransformToGrid",
    value: function shouldTransformToGrid(opts) {
      var projectPoints = opts.projectPoints,
          changeFlags = opts.changeFlags;

      if (!this.state.gridPositions || changeFlags.dataChanged || projectPoints && changeFlags.viewportChanged) {
          return true;
        }

      return false;
    }
  }, {
    key: "updateGridSize",
    value: function updateGridSize(opts) {
      var viewport = opts.viewport,
          cellSize = opts.cellSize;
      var width = opts.width || viewport.width;
      var height = opts.height || viewport.height;
      var numCol = Math.ceil(width / cellSize[0]);
      var numRow = Math.ceil(height / cellSize[1]);
      this.setState({
        numCol: numCol,
        numRow: numRow,
        windowSize: [width, height]
      });
    }
  }, {
    key: "validateProps",
    value: function validateProps(aggregationParams, opts) {
      var changeFlags = aggregationParams.changeFlags,
          projectPoints = aggregationParams.projectPoints,
          gridTransformMatrix = aggregationParams.gridTransformMatrix;

      _keplerOutdatedDeck.log.assert(changeFlags.dataChanged || changeFlags.viewportChanged || changeFlags.cellSizeChanged);

      _keplerOutdatedDeck.log.assert(!changeFlags.dataChanged || opts.positions && opts.weights && (!opts.projectPositions || opts.viewport) && opts.cellSize);

      _keplerOutdatedDeck.log.assert(!changeFlags.cellSizeChanged || opts.cellSize);

      _keplerOutdatedDeck.log.assert(!(changeFlags.viewportChanged && projectPoints) || opts.viewport);

      if (projectPoints && gridTransformMatrix) {
        _keplerOutdatedDeck.log.warn('projectPoints is true, gridTransformMatrix is ignored')();
      }
    }
  }, {
    key: "calculateAggregationData",
    value: function calculateAggregationData(opts) {
      var weights = opts.weights,
          results = opts.results,
          cellIndex = opts.cellIndex,
          posIndex = opts.posIndex;

      for (var id in weights) {
        var _weights$id = weights[id],
            values = _weights$id.values,
            size = _weights$id.size,
            operation = _weights$id.operation;
        var aggregationData = results[id].aggregationData;

        for (var sizeIndex = 0; sizeIndex < size; sizeIndex++) {
          var cellElementIndex = cellIndex + sizeIndex;
          var weightComponent = values[posIndex * _gpuGridAggregatorConstants.WEIGHT_SIZE + sizeIndex];

          if (aggregationData[cellIndex + 3] === 0) {
            aggregationData[cellElementIndex] = weightComponent;
          } else {
            switch (operation) {
              case _aggregationOperationUtils.AGGREGATION_OPERATION.SUM:
              case _aggregationOperationUtils.AGGREGATION_OPERATION.MEAN:
                aggregationData[cellElementIndex] += weightComponent;
                break;

              case _aggregationOperationUtils.AGGREGATION_OPERATION.MIN:
                aggregationData[cellElementIndex] = Math.min(aggregationData[cellElementIndex], weightComponent);
                break;

              case _aggregationOperationUtils.AGGREGATION_OPERATION.MAX:
                aggregationData[cellElementIndex] = Math.max(aggregationData[cellElementIndex], weightComponent);
                break;

              default:
                _keplerOutdatedDeck.log.assert(false);

                break;
            }
          }
        }

        aggregationData[cellIndex + 3]++;
      }
    }
  }, {
    key: "calculateMeanMaxMinData",
    value: function calculateMeanMaxMinData(opts) {
      var validCellIndices = opts.validCellIndices,
          results = opts.results,
          weights = opts.weights;
      validCellIndices.forEach(function (cellIndex) {
        for (var id in results) {
          var _weights$id2 = weights[id],
              size = _weights$id2.size,
              needMin = _weights$id2.needMin,
              needMax = _weights$id2.needMax,
              operation = _weights$id2.operation;
          var _results$id = results[id],
              aggregationData = _results$id.aggregationData,
              minData = _results$id.minData,
              maxData = _results$id.maxData,
              maxMinData = _results$id.maxMinData;
          var calculateMinMax = needMin || needMax;
          var calculateMean = operation === _aggregationOperationUtils.AGGREGATION_OPERATION.MEAN;
          var combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
          var count = aggregationData[cellIndex + _gpuGridAggregatorConstants.ELEMENTCOUNT - 1];

          for (var sizeIndex = 0; sizeIndex < size && (calculateMinMax || calculateMean); sizeIndex++) {
            var cellElementIndex = cellIndex + sizeIndex;
            var weight = aggregationData[cellElementIndex];

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
            maxMinData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] = Math.min(maxMinData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1], aggregationData[cellIndex + 0]);
          } else {
            if (needMin) {
              minData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] += count;
            }

            if (needMax) {
              maxData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] += count;
            }
          }
        }
      });
    }
  }, {
    key: "initCPUResults",
    value: function initCPUResults(opts) {
      var weights = opts.weights || this.state.weights;
      var _this$state2 = this.state,
          numCol = _this$state2.numCol,
          numRow = _this$state2.numRow;
      var results = {};

      for (var id in weights) {
        var _weights$id3 = weights[id],
            aggregationData = _weights$id3.aggregationData,
            minData = _weights$id3.minData,
            maxData = _weights$id3.maxData,
            maxMinData = _weights$id3.maxMinData;
        var _weights$id4 = weights[id],
            needMin = _weights$id4.needMin,
            needMax = _weights$id4.needMax;
        var combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
        var aggregationSize = numCol * numRow * _gpuGridAggregatorConstants.ELEMENTCOUNT;
        aggregationData = (0, _gpuGridAggregatorUtils.getFloatArray)(aggregationData, aggregationSize);

        if (combineMaxMin) {
          maxMinData = (0, _gpuGridAggregatorUtils.getFloatArray)(maxMinData, _gpuGridAggregatorConstants.ELEMENTCOUNT);
          maxMinData.fill(-Infinity, 0, _gpuGridAggregatorConstants.ELEMENTCOUNT - 1);
          maxMinData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] = Infinity;
        } else {
          if (needMin) {
            minData = (0, _gpuGridAggregatorUtils.getFloatArray)(minData, _gpuGridAggregatorConstants.ELEMENTCOUNT, Infinity);
            minData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] = 0;
          }

          if (needMax) {
            maxData = (0, _gpuGridAggregatorUtils.getFloatArray)(maxData, _gpuGridAggregatorConstants.ELEMENTCOUNT, -Infinity);
            maxData[_gpuGridAggregatorConstants.ELEMENTCOUNT - 1] = 0;
          }
        }

        results[id] = Object.assign({}, weights[id], {
          aggregationData: aggregationData,
          minData: minData,
          maxData: maxData,
          maxMinData: maxMinData
        });
      }

      return results;
    }
  }, {
    key: "runAggregationOnCPU",
    value: function runAggregationOnCPU(opts) {
      var positions = opts.positions,
          cellSize = opts.cellSize,
          gridTransformMatrix = opts.gridTransformMatrix,
          viewport = opts.viewport,
          projectPoints = opts.projectPoints;
      var weights = opts.weights;
      var _this$state3 = this.state,
          numCol = _this$state3.numCol,
          numRow = _this$state3.numRow;
      var results = this.initCPUResults(opts);
      var gridTransformRequired = this.shouldTransformToGrid(opts);
      var gridPositions;
      var pos = [0, 0, 0];

      _keplerOutdatedDeck.log.assert(gridTransformRequired || opts.changeFlags.cellSizeChanged);

      var posCount;

      if (gridTransformRequired) {
        posCount = positions.length / 2;
        gridPositions = new Float64Array(positions.length);
        this.setState({
          gridPositions: gridPositions
        });
      } else {
        gridPositions = this.state.gridPositions;
        weights = this.state.weights;
        posCount = gridPositions.length / 2;
      }

      var validCellIndices = new Set();

      for (var posIndex = 0; posIndex < posCount; posIndex++) {
        var x = void 0;
        var y = void 0;

        if (gridTransformRequired) {
          pos[0] = positions[posIndex * 2];
          pos[1] = positions[posIndex * 2 + 1];

          if (projectPoints) {
            var _viewport$project = viewport.project(pos);

            var _viewport$project2 = (0, _slicedToArray2.default)(_viewport$project, 2);

            x = _viewport$project2[0];
            y = _viewport$project2[1];
          } else {
            var _worldToPixels = (0, _viewportMercatorProject.worldToPixels)(pos, gridTransformMatrix);

            var _worldToPixels2 = (0, _slicedToArray2.default)(_worldToPixels, 2);

            x = _worldToPixels2[0];
            y = _worldToPixels2[1];
          }

          gridPositions[posIndex * 2] = x;
          gridPositions[posIndex * 2 + 1] = y;
        } else {
          x = gridPositions[posIndex * 2];
          y = gridPositions[posIndex * 2 + 1];
        }

        var colId = Math.floor(x / cellSize[0]);
        var rowId = Math.floor(y / cellSize[1]);

        if (colId >= 0 && colId < numCol && rowId >= 0 && rowId < numRow) {
          var cellIndex = (colId + rowId * numCol) * _gpuGridAggregatorConstants.ELEMENTCOUNT;
          validCellIndices.add(cellIndex);
          this.calculateAggregationData({
            weights: weights,
            results: results,
            cellIndex: cellIndex,
            posIndex: posIndex
          });
        }
      }

      this.calculateMeanMaxMinData({
        validCellIndices: validCellIndices,
        results: results,
        weights: weights
      });
      this.updateAggregationBuffers(opts, results);
      this.setState({
        results: results
      });
      return results;
    }
  }, {
    key: "updateCPUResultBuffer",
    value: function updateCPUResultBuffer(_ref3) {
      var gl = _ref3.gl,
          bufferName = _ref3.bufferName,
          id = _ref3.id,
          data = _ref3.data,
          result = _ref3.result;
      var resources = this.state.resources;
      var resourceName = "cpu-result-".concat(id, "-").concat(bufferName);
      result[bufferName] = result[bufferName] || resources[resourceName];

      if (result[bufferName]) {
        result[bufferName].setData({
          data: data
        });
      } else {
        resources[resourceName] = new _core.Buffer(gl, data);
        result[bufferName] = resources[resourceName];
      }
    }
  }, {
    key: "updateAggregationBuffers",
    value: function updateAggregationBuffers(opts, results) {
      if (!opts.createBufferObjects) {
        return;
      }

      var weights = opts.weights || this.state.weights;

      for (var id in results) {
        var _results$id2 = results[id],
            aggregationData = _results$id2.aggregationData,
            minData = _results$id2.minData,
            maxData = _results$id2.maxData,
            maxMinData = _results$id2.maxMinData;
        var _weights$id5 = weights[id],
            needMin = _weights$id5.needMin,
            needMax = _weights$id5.needMax;
        var combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
        this.updateCPUResultBuffer({
          gl: this.gl,
          bufferName: 'aggregationBuffer',
          id: id,
          data: aggregationData,
          result: results[id]
        });

        if (combineMaxMin) {
          this.updateCPUResultBuffer({
            gl: this.gl,
            bufferName: 'maxMinBuffer',
            id: id,
            data: maxMinData,
            result: results[id]
          });
        } else {
          if (needMin) {
            this.updateCPUResultBuffer({
              gl: this.gl,
              bufferName: 'minBuffer',
              id: id,
              data: minData,
              result: results[id]
            });
          }

          if (needMax) {
            this.updateCPUResultBuffer({
              gl: this.gl,
              bufferName: 'maxBuffer',
              id: id,
              data: maxData,
              result: results[id]
            });
          }
        }
      }
    }
  }, {
    key: "getAggregateData",
    value: function getAggregateData(opts) {
      var results = {};
      var _this$state4 = this.state,
          textures = _this$state4.textures,
          framebuffers = _this$state4.framebuffers,
          maxMinFramebuffers = _this$state4.maxMinFramebuffers,
          minFramebuffers = _this$state4.minFramebuffers,
          maxFramebuffers = _this$state4.maxFramebuffers,
          weights = _this$state4.weights;

      for (var id in weights) {
        results[id] = {};
        var _weights$id6 = weights[id],
            needMin = _weights$id6.needMin,
            needMax = _weights$id6.needMax,
            combineMaxMin = _weights$id6.combineMaxMin;
        results[id].aggregationTexture = textures[id];
        results[id].aggregationBuffer = (0, _core.readPixelsToBuffer)(framebuffers[id], {
          target: weights[id].aggregationBuffer,
          sourceType: 5126
        });

        if (needMin && needMax && combineMaxMin) {
          results[id].maxMinBuffer = (0, _core.readPixelsToBuffer)(maxMinFramebuffers[id], {
            target: weights[id].maxMinBuffer,
            sourceType: 5126
          });
        } else {
          if (needMin) {
            results[id].minBuffer = (0, _core.readPixelsToBuffer)(minFramebuffers[id], {
              target: weights[id].minBuffer,
              sourceType: 5126
            });
          }

          if (needMax) {
            results[id].maxBuffer = (0, _core.readPixelsToBuffer)(maxFramebuffers[id], {
              target: weights[id].maxBuffer,
              sourceType: 5126
            });
          }
        }
      }

      this.trackGPUResultBuffers(results, weights);
      return results;
    }
  }, {
    key: "getAggregationModel",
    value: function getAggregationModel() {
      var fp64 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var gl = this.gl,
          shaderCache = this.shaderCache;
      return new _core.Model(gl, {
        id: 'Gird-Aggregation-Model',
        vs: fp64 ? _aggregateToGridVs2.default : _aggregateToGridVs.default,
        fs: _aggregateToGridFs.default,
        modules: fp64 ? ['fp64', 'project64'] : ['project32'],
        shaderCache: shaderCache,
        vertexCount: 0,
        drawMode: 0
      });
    }
  }, {
    key: "getAllAggregationModel",
    value: function getAllAggregationModel() {
      var gl = this.gl,
          shaderCache = this.shaderCache;
      var _this$state5 = this.state,
          numCol = _this$state5.numCol,
          numRow = _this$state5.numRow;
      return new _core.Model(gl, {
        id: 'All-Aggregation-Model',
        vs: _aggregateAllVs.default,
        fs: _aggregateAllFs.default,
        modules: ['fp64'],
        shaderCache: shaderCache,
        vertexCount: 1,
        drawMode: 0,
        isInstanced: true,
        instanceCount: numCol * numRow,
        attributes: {
          position: [0, 0]
        }
      });
    }
  }, {
    key: "getMeanTransform",
    value: function getMeanTransform(opts) {
      if (this.meanTransform) {
        this.meanTransform.update(opts);
      } else {
        this.meanTransform = new _core.Transform(this.gl, Object.assign({}, {
          vs: _transformMeanVs.default,
          _targetTextureVarying: 'meanValues'
        }, opts));
      }

      return this.meanTransform;
    }
  }, {
    key: "renderAggregateData",
    value: function renderAggregateData(opts) {
      var cellSize = opts.cellSize,
          viewport = opts.viewport,
          gridTransformMatrix = opts.gridTransformMatrix,
          projectPoints = opts.projectPoints;
      var _this$state6 = this.state,
          numCol = _this$state6.numCol,
          numRow = _this$state6.numRow,
          windowSize = _this$state6.windowSize,
          maxMinFramebuffers = _this$state6.maxMinFramebuffers,
          minFramebuffers = _this$state6.minFramebuffers,
          maxFramebuffers = _this$state6.maxFramebuffers,
          weights = _this$state6.weights;
      var uProjectionMatrixFP64 = fp64ifyMatrix4(gridTransformMatrix);
      var gridSize = [numCol, numRow];
      var parameters = {
        blend: true,
        depthTest: false,
        blendFunc: [1, 1]
      };
      var moduleSettings = {
        viewport: viewport
      };
      var uniforms = {
        windowSize: windowSize,
        cellSize: cellSize,
        gridSize: gridSize,
        uProjectionMatrix: gridTransformMatrix,
        uProjectionMatrixFP64: uProjectionMatrixFP64,
        projectPoints: projectPoints
      };

      for (var id in weights) {
        var _weights$id7 = weights[id],
            needMin = _weights$id7.needMin,
            needMax = _weights$id7.needMax;
        var combineMaxMin = needMin && needMax && weights[id].combineMaxMin;
        this.renderToWeightsTexture({
          id: id,
          parameters: parameters,
          moduleSettings: moduleSettings,
          uniforms: uniforms,
          gridSize: gridSize
        });

        if (combineMaxMin) {
          this.renderToMaxMinTexture({
            id: id,
            parameters: Object.assign({}, parameters, {
              blendEquation: _gpuGridAggregatorConstants.MAX_MIN_BLEND_EQUATION
            }),
            gridSize: gridSize,
            minOrMaxFb: maxMinFramebuffers[id],
            clearParams: {
              clearColor: [0, 0, 0, _gpuGridAggregatorConstants.MAX_32_BIT_FLOAT]
            },
            combineMaxMin: combineMaxMin
          });
        } else {
          if (needMin) {
            this.renderToMaxMinTexture({
              id: id,
              parameters: Object.assign({}, parameters, {
                blendEquation: _gpuGridAggregatorConstants.MIN_BLEND_EQUATION
              }),
              gridSize: gridSize,
              minOrMaxFb: minFramebuffers[id],
              clearParams: {
                clearColor: [_gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, _gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, _gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, 0]
              },
              combineMaxMin: combineMaxMin
            });
          }

          if (needMax) {
            this.renderToMaxMinTexture({
              id: id,
              parameters: Object.assign({}, parameters, {
                blendEquation: _gpuGridAggregatorConstants.MAX_BLEND_EQUATION
              }),
              gridSize: gridSize,
              minOrMaxFb: maxFramebuffers[id],
              combineMaxMin: combineMaxMin
            });
          }
        }
      }
    }
  }, {
    key: "renderToMaxMinTexture",
    value: function renderToMaxMinTexture(opts) {
      var id = opts.id,
          parameters = opts.parameters,
          gridSize = opts.gridSize,
          minOrMaxFb = opts.minOrMaxFb,
          combineMaxMin = opts.combineMaxMin,
          _opts$clearParams = opts.clearParams,
          clearParams = _opts$clearParams === void 0 ? {} : _opts$clearParams;
      var framebuffers = this.state.framebuffers;
      var gl = this.gl,
          allAggregationModel = this.allAggregationModel;
      minOrMaxFb.bind();
      gl.viewport(0, 0, gridSize[0], gridSize[1]);
      (0, _core.withParameters)(gl, clearParams, function () {
        gl.clear(16384);
      });
      allAggregationModel.draw({
        parameters: parameters,
        uniforms: {
          uSampler: framebuffers[id].texture,
          gridSize: gridSize,
          combineMaxMin: combineMaxMin
        }
      });
      minOrMaxFb.unbind();
    }
  }, {
    key: "renderToWeightsTexture",
    value: function renderToWeightsTexture(opts) {
      var id = opts.id,
          parameters = opts.parameters,
          moduleSettings = opts.moduleSettings,
          uniforms = opts.uniforms,
          gridSize = opts.gridSize;
      var _this$state7 = this.state,
          framebuffers = _this$state7.framebuffers,
          equations = _this$state7.equations,
          weightAttributes = _this$state7.weightAttributes,
          weights = _this$state7.weights;
      var gl = this.gl,
          gridAggregationModel = this.gridAggregationModel;
      var operation = weights[id].operation;
      framebuffers[id].bind();
      gl.viewport(0, 0, gridSize[0], gridSize[1]);
      var clearColor = operation === _aggregationOperationUtils.AGGREGATION_OPERATION.MIN ? [_gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, _gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, _gpuGridAggregatorConstants.MAX_32_BIT_FLOAT, 0] : [0, 0, 0, 0];
      (0, _core.withParameters)(gl, {
        clearColor: clearColor
      }, function () {
        gl.clear(16384);
      });
      var attributes = {
        weights: weightAttributes[id]
      };
      gridAggregationModel.draw({
        parameters: Object.assign({}, parameters, {
          blendEquation: equations[id]
        }),
        moduleSettings: moduleSettings,
        uniforms: uniforms,
        attributes: attributes
      });
      framebuffers[id].unbind();

      if (operation === _aggregationOperationUtils.AGGREGATION_OPERATION.MEAN) {
        var _this$state8 = this.state,
            meanTextures = _this$state8.meanTextures,
            textures = _this$state8.textures;
        var transformOptions = {
          _sourceTextures: {
            aggregationValues: meanTextures[id]
          },
          _targetTexture: textures[id],
          elementCount: textures[id].width * textures[id].height
        };
        var meanTransform = this.getMeanTransform(transformOptions);
        meanTransform.run({
          parameters: {
            blend: false,
            depthTest: false
          }
        });
        framebuffers[id].attach((0, _defineProperty2.default)({}, 36064, textures[id]));
      }
    }
  }, {
    key: "runAggregationOnGPU",
    value: function runAggregationOnGPU(opts) {
      this.updateModels(opts);
      this.setupFramebuffers(opts);
      this.renderAggregateData(opts);
      var results = this.getAggregateData(opts);
      this.setState({
        results: results
      });
      return results;
    }
  }, {
    key: "setupFramebuffers",
    value: function setupFramebuffers(opts) {
      var _this$state9 = this.state,
          numCol = _this$state9.numCol,
          numRow = _this$state9.numRow,
          textures = _this$state9.textures,
          framebuffers = _this$state9.framebuffers,
          maxMinFramebuffers = _this$state9.maxMinFramebuffers,
          minFramebuffers = _this$state9.minFramebuffers,
          maxFramebuffers = _this$state9.maxFramebuffers,
          resources = _this$state9.resources,
          meanTextures = _this$state9.meanTextures,
          equations = _this$state9.equations,
          weights = _this$state9.weights;
      var framebufferSize = {
        width: numCol,
        height: numRow
      };

      for (var id in weights) {
        var _weights$id8 = weights[id],
            needMin = _weights$id8.needMin,
            needMax = _weights$id8.needMax,
            combineMaxMin = _weights$id8.combineMaxMin,
            operation = _weights$id8.operation;
        textures[id] = weights[id].aggregationTexture || textures[id] || (0, _gpuGridAggregatorUtils.getFloatTexture)(this.gl, {
          id: "".concat(id, "-texture"),
          width: numCol,
          height: numRow
        });
        textures[id].resize(framebufferSize);
        var texture = textures[id];

        if (operation === _aggregationOperationUtils.AGGREGATION_OPERATION.MEAN) {
          meanTextures[id] = meanTextures[id] || (0, _gpuGridAggregatorUtils.getFloatTexture)(this.gl, {
            id: "".concat(id, "-mean-texture"),
            width: numCol,
            height: numRow
          });
          meanTextures[id].resize(framebufferSize);
          texture = meanTextures[id];
        }

        if (framebuffers[id]) {
          framebuffers[id].attach((0, _defineProperty2.default)({}, 36064, texture));
        } else {
          framebuffers[id] = (0, _gpuGridAggregatorUtils.getFramebuffer)(this.gl, {
            id: "".concat(id, "-fb"),
            width: numCol,
            height: numRow,
            texture: texture
          });
        }

        framebuffers[id].resize(framebufferSize);
        equations[id] = _gpuGridAggregatorConstants.EQUATION_MAP[operation];

        if (needMin || needMax) {
          if (needMin && needMax && combineMaxMin) {
            if (!maxMinFramebuffers[id]) {
              resources["".concat(id, "-maxMin")] = (0, _gpuGridAggregatorUtils.getFloatTexture)(this.gl, {
                id: "".concat(id, "-maxMinTex")
              });
              maxMinFramebuffers[id] = (0, _gpuGridAggregatorUtils.getFramebuffer)(this.gl, {
                id: "".concat(id, "-maxMinFb"),
                texture: resources["".concat(id, "-maxMin")]
              });
            }
          } else {
            if (needMin) {
              if (!minFramebuffers[id]) {
                resources["".concat(id, "-min")] = (0, _gpuGridAggregatorUtils.getFloatTexture)(this.gl, {
                  id: "".concat(id, "-minTex")
                });
                minFramebuffers[id] = (0, _gpuGridAggregatorUtils.getFramebuffer)(this.gl, {
                  id: "".concat(id, "-minFb"),
                  texture: resources["".concat(id, "-min")]
                });
              }
            }

            if (needMax) {
              if (!maxFramebuffers[id]) {
                resources["".concat(id, "-max")] = (0, _gpuGridAggregatorUtils.getFloatTexture)(this.gl, {
                  id: "".concat(id, "-maxTex")
                });
                maxFramebuffers[id] = (0, _gpuGridAggregatorUtils.getFramebuffer)(this.gl, {
                  id: "".concat(id, "-maxFb"),
                  texture: resources["".concat(id, "-max")]
                });
              }
            }
          }
        }
      }
    }
  }, {
    key: "setupModels",
    value: function setupModels() {
      var fp64 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (this.gridAggregationModel) {
        this.gridAggregationModel.delete();
      }

      this.gridAggregationModel = this.getAggregationModel(fp64);

      if (!this.allAggregationModel) {
        this.allAggregationModel = this.getAllAggregationModel();
      }
    }
  }, {
    key: "setupWeightAttributes",
    value: function setupWeightAttributes(opts) {
      var _this$state10 = this.state,
          weightAttributes = _this$state10.weightAttributes,
          vertexCount = _this$state10.vertexCount,
          weights = _this$state10.weights,
          resources = _this$state10.resources;

      for (var id in weights) {
        var values = weights[id].values;

        if (Array.isArray(values) || values.constructor === Float32Array) {
          _keplerOutdatedDeck.log.assert(values.length / 3 === vertexCount);

          var typedArray = Array.isArray(values) ? new Float32Array(values) : values;

          if (weightAttributes[id] instanceof _core.Buffer) {
            weightAttributes[id].setData(typedArray);
          } else {
            resources["".concat(id, "-buffer")] = new _core.Buffer(this.gl, typedArray);
            weightAttributes[id] = resources["".concat(id, "-buffer")];
          }
        } else {
          _keplerOutdatedDeck.log.assert(values instanceof _core.Buffer);

          weightAttributes[id] = values;
        }
      }
    }
  }, {
    key: "trackGPUResultBuffers",
    value: function trackGPUResultBuffers(results, weights) {
      var resources = this.state.resources;

      for (var id in results) {
        if (results[id]) {
          for (var _i = 0; _i < BUFFER_NAMES.length; _i++) {
            var bufferName = BUFFER_NAMES[_i];

            if (results[id][bufferName] && weights[id][bufferName] !== results[id][bufferName]) {
              var name = "gpu-result-".concat(id, "-").concat(bufferName);

              if (resources[name]) {
                resources[name].delete();
              }

              resources[name] = results[id][bufferName];
            }
          }
        }
      }
    }
  }, {
    key: "updateModels",
    value: function updateModels(opts) {
      var gl = this.gl;
      var positions = opts.positions,
          positions64xyLow = opts.positions64xyLow,
          changeFlags = opts.changeFlags;
      var _this$state11 = this.state,
          numCol = _this$state11.numCol,
          numRow = _this$state11.numRow;
      var aggregationModelAttributes = {};
      var modelDirty = false;

      if (opts.fp64 !== this.state.fp64) {
        this.setupModels(opts.fp64);
        this.setState({
          fp64: opts.fp64
        });
        modelDirty = true;
      }

      if (changeFlags.dataChanged || !this.state.positionsBuffer) {
        var _this$state12 = this.state,
            positionsBuffer = _this$state12.positionsBuffer,
            positions64xyLowBuffer = _this$state12.positions64xyLowBuffer;

        if (positionsBuffer) {
          positionsBuffer.delete();
        }

        if (positions64xyLowBuffer) {
          positions64xyLowBuffer.delete();
        }

        var vertexCount = positions.length / 2;
        positionsBuffer = new _core.Buffer(gl, new Float32Array(positions));
        positions64xyLowBuffer = new _core.Buffer(gl, {
          data: new Float32Array(positions64xyLow),
          accessor: {
            size: 2
          }
        });
        this.setState({
          positionsBuffer: positionsBuffer,
          positions64xyLowBuffer: positions64xyLowBuffer,
          vertexCount: vertexCount
        });
        this.setupWeightAttributes(opts);
        modelDirty = true;
      }

      if (modelDirty) {
        var _this$state13 = this.state,
            _vertexCount = _this$state13.vertexCount,
            _positionsBuffer = _this$state13.positionsBuffer,
            _positions64xyLowBuffer = _this$state13.positions64xyLowBuffer;
        aggregationModelAttributes.positions = _positionsBuffer;

        if (opts.fp64) {
          aggregationModelAttributes.positions64xyLow = _positions64xyLowBuffer;
        }

        this.gridAggregationModel.setVertexCount(_vertexCount);
        this.gridAggregationModel.setAttributes(aggregationModelAttributes);
      }

      if (changeFlags.cellSizeChanged || changeFlags.viewportChanged) {
        this.allAggregationModel.setInstanceCount(numCol * numRow);
      }
    }
  }]);
  return GPUGridAggregator;
}();

exports.default = GPUGridAggregator;
//# sourceMappingURL=gpu-grid-aggregator.js.map