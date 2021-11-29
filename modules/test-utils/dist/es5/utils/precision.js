"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toLowPrecision = toLowPrecision;

function toLowPrecision(input) {
  let precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 11;

  if (typeof input === 'number') {
    input = Number(input.toPrecision(precision));
  }

  if (Array.isArray(input)) {
    input = input.map(item => toLowPrecision(item, precision));
  }

  if (typeof input === 'object') {
    for (const key in input) {
      input[key] = toLowPrecision(input[key], precision);
    }
  }

  return input;
}
//# sourceMappingURL=precision.js.map