export var AGGREGATION_OPERATION = {
  SUM: 1,
  MEAN: 2,
  MIN: 3,
  MAX: 4
};

function sumReducer(accu, cur) {
  return accu + cur;
}

function maxReducer(accu, cur) {
  return cur > accu ? cur : accu;
}

function minReducer(accu, cur) {
  return cur < accu ? cur : accu;
}

export function getMean(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) / filtered.length : null;
}
export function getSum(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(sumReducer, 0) : null;
}
export function getMax(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(maxReducer, -Infinity) : null;
}
export function getMin(pts, accessor) {
  var filtered = pts.map(accessor).filter(Number.isFinite);
  return filtered.length ? filtered.reduce(minReducer, Infinity) : null;
}
export function getValueFunc(aggregation, accessor) {
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