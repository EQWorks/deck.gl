import _typeof from "@babel/runtime/helpers/esm/typeof";
export function toLowPrecision(input) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 11;

  if (typeof input === 'number') {
    input = Number(input.toPrecision(precision));
  }

  if (Array.isArray(input)) {
    input = input.map(function (item) {
      return toLowPrecision(item, precision);
    });
  }

  if (_typeof(input) === 'object') {
    for (var key in input) {
      input[key] = toLowPrecision(input[key], precision);
    }
  }

  return input;
}
//# sourceMappingURL=precision.js.map