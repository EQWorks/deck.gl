import * as vec4 from 'gl-matrix/vec4';
import assert from '../utils/assert';
export function transformVector(matrix, vector) {
  if (!matrix) {
    return null;
  }

  const result = vec4.transformMat4([0, 0, 0, 0], vector, matrix);
  const scale = 1 / result[3];
  vec4.multiply(result, result, [scale, scale, scale, scale]);
  return result;
}
export function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function extractCameraVectors(_ref) {
  let viewMatrix = _ref.viewMatrix,
      viewMatrixInverse = _ref.viewMatrixInverse;
  return {
    eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
    direction: [viewMatrix[2], viewMatrix[6], viewMatrix[10]],
    up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]]
  };
}
export function mod(value, divisor) {
  assert(Number.isFinite(value) && Number.isFinite(divisor));
  const modulus = value % divisor;
  return modulus < 0 ? divisor + modulus : modulus;
}
//# sourceMappingURL=math-utils.js.map