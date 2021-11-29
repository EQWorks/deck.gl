"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WEIGHT_SIZE = exports.PIXEL_SIZE = exports.MIN_BLEND_EQUATION = exports.MAX_MIN_BLEND_EQUATION = exports.MAX_BLEND_EQUATION = exports.MAX_32_BIT_FLOAT = exports.IDENTITY_MATRIX = exports.EQUATION_MAP = exports.ELEMENTCOUNT = exports.DEFAULT_WEIGHT_PARAMS = exports.DEFAULT_RUN_PARAMS = exports.DEFAULT_CHANGE_FLAGS = void 0;

var _aggregationOperationUtils = require("../aggregation-operation-utils");

const DEFAULT_CHANGE_FLAGS = {
  dataChanged: true,
  viewportChanged: true,
  cellSizeChanged: true
};
exports.DEFAULT_CHANGE_FLAGS = DEFAULT_CHANGE_FLAGS;
const DEFAULT_RUN_PARAMS = {
  changeFlags: DEFAULT_CHANGE_FLAGS,
  projectPoints: false,
  useGPU: true,
  fp64: false,
  viewport: null,
  gridTransformMatrix: null,
  createBufferObjects: true
};
exports.DEFAULT_RUN_PARAMS = DEFAULT_RUN_PARAMS;
const MAX_32_BIT_FLOAT = 3.402823466e38;
exports.MAX_32_BIT_FLOAT = MAX_32_BIT_FLOAT;
const MIN_BLEND_EQUATION = [32775, 32774];
exports.MIN_BLEND_EQUATION = MIN_BLEND_EQUATION;
const MAX_BLEND_EQUATION = [32776, 32774];
exports.MAX_BLEND_EQUATION = MAX_BLEND_EQUATION;
const MAX_MIN_BLEND_EQUATION = [32776, 32775];
exports.MAX_MIN_BLEND_EQUATION = MAX_MIN_BLEND_EQUATION;
const EQUATION_MAP = {
  [_aggregationOperationUtils.AGGREGATION_OPERATION.SUM]: 32774,
  [_aggregationOperationUtils.AGGREGATION_OPERATION.MEAN]: 32774,
  [_aggregationOperationUtils.AGGREGATION_OPERATION.MIN]: MIN_BLEND_EQUATION,
  [_aggregationOperationUtils.AGGREGATION_OPERATION.MAX]: MAX_BLEND_EQUATION
};
exports.EQUATION_MAP = EQUATION_MAP;
const ELEMENTCOUNT = 4;
exports.ELEMENTCOUNT = ELEMENTCOUNT;
const DEFAULT_WEIGHT_PARAMS = {
  size: 1,
  operation: _aggregationOperationUtils.AGGREGATION_OPERATION.SUM,
  needMin: false,
  needMax: false,
  combineMaxMin: false
};
exports.DEFAULT_WEIGHT_PARAMS = DEFAULT_WEIGHT_PARAMS;
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
exports.IDENTITY_MATRIX = IDENTITY_MATRIX;
const PIXEL_SIZE = 4;
exports.PIXEL_SIZE = PIXEL_SIZE;
const WEIGHT_SIZE = 3;
exports.WEIGHT_SIZE = WEIGHT_SIZE;
//# sourceMappingURL=gpu-grid-aggregator-constants.js.map