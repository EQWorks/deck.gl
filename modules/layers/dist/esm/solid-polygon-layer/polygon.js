import earcut from 'earcut';

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
  var p0 = simplePolygon[0];
  var p1 = simplePolygon[simplePolygon.length - 1];
  return p0[0] === p1[0] && p0[1] === p1[1] && p0[2] === p1[2];
}

function isFlatRingClosed(positions, size, startIndex, endIndex) {
  for (var i = 0; i < size; i++) {
    if (positions[startIndex + i] !== positions[endIndex - size + i]) {
      return false;
    }
  }

  return true;
}

function copyNestedRing(target, targetStartIndex, simplePolygon, size) {
  var targetIndex = targetStartIndex;
  var len = simplePolygon.length;

  for (var i = 0; i < len; i++) {
    for (var j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[i][j] || 0;
    }
  }

  if (!isNestedRingClosed(simplePolygon)) {
    for (var _j = 0; _j < size; _j++) {
      target[targetIndex++] = simplePolygon[0][_j] || 0;
    }
  }

  return targetIndex;
}

function copyFlatRing(target, targetStartIndex, positions, size) {
  var srcStartIndex = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  var srcEndIndex = arguments.length > 5 ? arguments[5] : undefined;
  srcEndIndex = srcEndIndex || positions.length;
  var srcLength = srcEndIndex - srcStartIndex;

  if (srcLength <= 0) {
    return targetStartIndex;
  }

  var targetIndex = targetStartIndex;

  for (var i = 0; i < srcLength; i++) {
    target[targetIndex++] = positions[srcStartIndex + i];
  }

  if (!isFlatRingClosed(positions, size, srcStartIndex, srcEndIndex)) {
    for (var _i = 0; _i < size; _i++) {
      target[targetIndex++] = positions[srcStartIndex + _i];
    }
  }

  return targetIndex;
}

function getNestedVertexCount(simplePolygon) {
  return (isNestedRingClosed(simplePolygon) ? 0 : 1) + simplePolygon.length;
}

function getFlatVertexCount(positions, size) {
  var startIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var endIndex = arguments.length > 3 ? arguments[3] : undefined;
  endIndex = endIndex || positions.length;

  if (startIndex >= endIndex) {
    return 0;
  }

  return (isFlatRingClosed(positions, size, startIndex, endIndex) ? 0 : 1) + (endIndex - startIndex) / size;
}

export function getVertexCount(polygon, positionSize) {
  validate(polygon);

  if (polygon.positions) {
    var _polygon = polygon,
        positions = _polygon.positions,
        holeIndices = _polygon.holeIndices;

    if (holeIndices) {
      var vertexCount = 0;

      for (var i = 0; i <= holeIndices.length; i++) {
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
    var _vertexCount = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = polygon[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var simplePolygon = _step.value;
        _vertexCount += getNestedVertexCount(simplePolygon);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return _vertexCount;
  }

  return getNestedVertexCount(polygon);
}
export function normalize(polygon, positionSize, vertexCount) {
  validate(polygon);
  vertexCount = vertexCount || getVertexCount(polygon, positionSize);
  var positions = new Float64Array(vertexCount * positionSize);
  var holeIndices = [];

  if (polygon.positions) {
    var _polygon2 = polygon,
        srcPositions = _polygon2.positions,
        srcHoleIndices = _polygon2.holeIndices;

    if (srcHoleIndices) {
      var targetIndex = 0;

      for (var i = 0; i <= srcHoleIndices.length; i++) {
        targetIndex = copyFlatRing(positions, targetIndex, srcPositions, positionSize, srcHoleIndices[i - 1], srcHoleIndices[i]);
        holeIndices.push(targetIndex);
      }

      holeIndices.pop();
      return {
        positions: positions,
        holeIndices: holeIndices
      };
    }

    polygon = srcPositions;
  }

  if (Number.isFinite(polygon[0])) {
    copyFlatRing(positions, 0, polygon, positionSize);
    return {
      positions: positions,
      holeIndices: null
    };
  }

  if (!isSimple(polygon)) {
    var _targetIndex = 0;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = polygon[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var simplePolygon = _step2.value;
        _targetIndex = copyNestedRing(positions, _targetIndex, simplePolygon, positionSize);
        holeIndices.push(_targetIndex);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    holeIndices.pop();
    return {
      positions: positions,
      holeIndices: holeIndices
    };
  }

  copyNestedRing(positions, 0, polygon, positionSize);
  return {
    positions: positions,
    holeIndices: null
  };
}
export function getSurfaceIndices(normalizedPolygon, positionSize) {
  var holeIndices = null;

  if (normalizedPolygon.holeIndices) {
    holeIndices = normalizedPolygon.holeIndices.map(function (positionIndex) {
      return positionIndex / positionSize;
    });
  }

  return earcut(normalizedPolygon.positions, holeIndices, positionSize);
}
//# sourceMappingURL=polygon.js.map