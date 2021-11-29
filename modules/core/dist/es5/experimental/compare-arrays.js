"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkArray = checkArray;
exports.compareArrays = compareArrays;

function compareArrays(array1, array2) {
  const length = Math.min(array1.length, array2.length);

  for (let i = 0; i < length; ++i) {
    if (array1[i] !== array2[i]) {
      return "Arrays are different in element ".concat(i, ": ").concat(array1[i], " vs ").concat(array2[i]);
    }
  }

  if (array1.length !== array2.length) {
    return "Arrays have different length ".concat(array1.length, " vs ").concat(array2.length);
  }

  return null;
}

function checkArray(array) {
  for (let i = 0; i < array.length; ++i) {
    if (!Number.isFinite(array[i])) {
      throw new Error("Array has invalid element ".concat(i, ": ").concat(array[i]));
    }
  }

  return null;
}
//# sourceMappingURL=compare-arrays.js.map