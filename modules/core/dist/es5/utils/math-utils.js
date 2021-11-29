"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMat4 = createMat4;
exports.extractCameraVectors = extractCameraVectors;
exports.mod = mod;
exports.transformVector = transformVector;

var vec4 = _interopRequireWildcard(require("gl-matrix/vec4"));

var _assert = _interopRequireDefault(require("../utils/assert"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function transformVector(matrix, vector) {
  if (!matrix) {
    return null;
  }

  const result = vec4.transformMat4([0, 0, 0, 0], vector, matrix);
  const scale = 1 / result[3];
  vec4.multiply(result, result, [scale, scale, scale, scale]);
  return result;
}

function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function extractCameraVectors(_ref) {
  let {
    viewMatrix,
    viewMatrixInverse
  } = _ref;
  return {
    eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
    direction: [viewMatrix[2], viewMatrix[6], viewMatrix[10]],
    up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]]
  };
}

function mod(value, divisor) {
  (0, _assert.default)(Number.isFinite(value) && Number.isFinite(divisor));
  const modulus = value % divisor;
  return modulus < 0 ? divisor + modulus : modulus;
}
//# sourceMappingURL=math-utils.js.map