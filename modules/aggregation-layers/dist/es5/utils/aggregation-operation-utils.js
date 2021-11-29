"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMean = getMean;
exports.getSum = getSum;
exports.getMax = getMax;
exports.getMin = getMin;
exports.getValueFunc = getValueFunc;
exports.AGGREGATION_OPERATION = void 0;
var AGGREGATION_OPERATION = {
  SUM: 1,
  MEAN: 2,
  MIN: 3,
  MAX: 4
};
exports.AGGREGATION_OPERATION = AGGREGATION_OPERATION;

function sumReducer(accu, cur) {
  return accu + cur;
}

function maxReducer(accu, cur) {
  return cur > accu ? cur : accu;
}

function minReducer(accu, cur) {
  return cur < accu ? cur : accu;
}

function getMean(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) / filtered.length : null;
}

function getSum(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) : null;
}

function getMax(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(maxReducer, -Infinity) : null;
}

function getMin(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(minReducer, Infinity) : null;
}

function getValueFunc(aggregation, accessor) {
  var op = AGGREGATION_OPERATION[aggregation.toUpperCase()] || AGGREGATION_OPERATION.SUM;

  switch (op) {
    case AGGREGATION_OPERATION.MIN:
      return function (pts) {
        return getMin(pts, accessor);
      };

    case AGGREGATION_OPERATION.SUM:
      return function (pts) {
        return getSum(pts, accessor);
      };

    case AGGREGATION_OPERATION.MEAN:
      return function (pts) {
        return getMean(pts, accessor);
      };

    case AGGREGATION_OPERATION.MAX:
      return function (pts) {
        return getMax(pts, accessor);
      };

    default:
      return null;
  }
}
//# sourceMappingURL=aggregation-operation-utils.js.map