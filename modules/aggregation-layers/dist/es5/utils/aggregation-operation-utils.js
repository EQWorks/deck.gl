"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AGGREGATION_OPERATION = void 0;
exports.getMax = getMax;
exports.getMean = getMean;
exports.getMin = getMin;
exports.getSum = getSum;
exports.getValueFunc = getValueFunc;
const AGGREGATION_OPERATION = {
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
  const filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) / filtered.length : null;
}

function getSum(pts, accessor) {
  const filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) : null;
}

function getMax(pts, accessor) {
  const filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(maxReducer, -Infinity) : null;
}

function getMin(pts, accessor) {
  const filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(minReducer, Infinity) : null;
}

function getValueFunc(aggregation, accessor) {
  const op = AGGREGATION_OPERATION[aggregation.toUpperCase()] || AGGREGATION_OPERATION.SUM;

  switch (op) {
    case AGGREGATION_OPERATION.MIN:
      return pts => getMin(pts, accessor);

    case AGGREGATION_OPERATION.SUM:
      return pts => getSum(pts, accessor);

    case AGGREGATION_OPERATION.MEAN:
      return pts => getMean(pts, accessor);

    case AGGREGATION_OPERATION.MAX:
      return pts => getMax(pts, accessor);

    default:
      return null;
  }
}
//# sourceMappingURL=aggregation-operation-utils.js.map