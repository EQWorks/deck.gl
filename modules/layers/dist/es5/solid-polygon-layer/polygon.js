"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSurfaceIndices = getSurfaceIndices;
exports.getVertexCount = getVertexCount;
exports.normalize = normalize;

var _earcut = _interopRequireDefault(require("earcut"));

function validate(polygon) {
  polygon = polygon && polygon.positions || polygon;

  if (!Array.isArray(polygon) && !ArrayBuffer.isView(polygon)) {
    throw new Error('invalid polygon');
  }
}

function isSimple(polygon) {
  return polygon.length >= 1 && polygon[0].length >= 2 && Number.isFinite(polygon[0][0]);
}

function isNestedRingClosed(simplePolygon) {
  const p0 = simplePolygon[0];
  const p1 = simplePolygon[simplePolygon.length - 1];
  return p0[0] === p1[0] && p0[1] === p1[1] && p0[2] === p1[2];
}

function isFlatRingClosed(positions, size, startIndex, endIndex) {
  for (let i = 0; i < size; i++) {
    if (positions[startIndex + i] !== positions[endIndex - size + i]) {
      return false;
    }
  }

  return true;
}

function copyNestedRing(target, targetStartIndex, simplePolygon, size) {
  let targetIndex = targetStartIndex;
  const len = simplePolygon.length;

  for (let i = 0; i < len; i++) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[i][j] || 0;
    }
  }

  if (!isNestedRingClosed(simplePolygon)) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[0][j] || 0;
    }
  }

  return targetIndex;
}

function copyFlatRing(target, targetStartIndex, positions, size) {
  let srcStartIndex = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  let srcEndIndex = arguments.length > 5 ? arguments[5] : undefined;
  srcEndIndex = srcEndIndex || positions.length;
  const srcLength = srcEndIndex - srcStartIndex;

  if (srcLength <= 0) {
    return targetStartIndex;
  }

  let targetIndex = targetStartIndex;

  for (let i = 0; i < srcLength; i++) {
    target[targetIndex++] = positions[srcStartIndex + i];
  }

  if (!isFlatRingClosed(positions, size, srcStartIndex, srcEndIndex)) {
    for (let i = 0; i < size; i++) {
      target[targetIndex++] = positions[srcStartIndex + i];
    }
  }

  return targetIndex;
}

function getNestedVertexCount(simplePolygon) {
  return (isNestedRingClosed(simplePolygon) ? 0 : 1) + simplePolygon.length;
}

function getFlatVertexCount(positions, size) {
  let startIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let endIndex = arguments.length > 3 ? arguments[3] : undefined;
  endIndex = endIndex || positions.length;

  if (startIndex >= endIndex) {
    return 0;
  }

  return (isFlatRingClosed(positions, size, startIndex, endIndex) ? 0 : 1) + (endIndex - startIndex) / size;
}

function getVertexCount(polygon, positionSize) {
  validate(polygon);

  if (polygon.positions) {
    const {
      positions,
      holeIndices
    } = polygon;

    if (holeIndices) {
      let vertexCount = 0;

      for (let i = 0; i <= holeIndices.length; i++) {
        vertexCount += getFlatVertexCount(polygon.positions, positionSize, holeIndices[i - 1], holeIndices[i]);
      }

      return vertexCount;
    }

    polygon = positions;
  }

  if (Number.isFinite(polygon[0])) {
    return getFlatVertexCount(polygon, positionSize);
  }

  if (!isSimple(polygon)) {
    let vertexCount = 0;

    for (const simplePolygon of polygon) {
      vertexCount += getNestedVertexCount(simplePolygon);
    }

    return vertexCount;
  }

  return getNestedVertexCount(polygon);
}

function normalize(polygon, positionSize, vertexCount) {
  validate(polygon);
  vertexCount = vertexCount || getVertexCount(polygon, positionSize);
  const positions = new Float64Array(vertexCount * positionSize);
  const holeIndices = [];

  if (polygon.positions) {
    const {
      positions: srcPositions,
      holeIndices: srcHoleIndices
    } = polygon;

    if (srcHoleIndices) {
      let targetIndex = 0;

      for (let i = 0; i <= srcHoleIndices.length; i++) {
        targetIndex = copyFlatRing(positions, targetIndex, srcPositions, positionSize, srcHoleIndices[i - 1], srcHoleIndices[i]);
        holeIndices.push(targetIndex);
      }

      holeIndices.pop();
      return {
        positions,
        holeIndices
      };
    }

    polygon = srcPositions;
  }

  if (Number.isFinite(polygon[0])) {
    copyFlatRing(positions, 0, polygon, positionSize);
    return {
      positions,
      holeIndices: null
    };
  }

  if (!isSimple(polygon)) {
    let targetIndex = 0;

    for (const simplePolygon of polygon) {
      targetIndex = copyNestedRing(positions, targetIndex, simplePolygon, positionSize);
      holeIndices.push(targetIndex);
    }

    holeIndices.pop();
    return {
      positions,
      holeIndices
    };
  }

  copyNestedRing(positions, 0, polygon, positionSize);
  return {
    positions,
    holeIndices: null
  };
}

function getSurfaceIndices(normalizedPolygon, positionSize) {
  let holeIndices = null;

  if (normalizedPolygon.holeIndices) {
    holeIndices = normalizedPolygon.holeIndices.map(positionIndex => positionIndex / positionSize);
  }

  return (0, _earcut.default)(normalizedPolygon.positions, holeIndices, positionSize);
}
//# sourceMappingURL=polygon.js.map