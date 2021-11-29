import { log } from 'kepler-outdated-deck.gl-core';
import { ISOLINES_CODE_OFFSET_MAP, ISOBANDS_CODE_OFFSET_MAP } from './marching-squares-codes';
export const CONTOUR_TYPE = {
  ISO_LINES: 1,
  ISO_BANDS: 2
};
const DEFAULT_THRESHOLD_DATA = {
  zIndex: 0,
  zOffset: 0.005
};

function getVertexCode(weight, threshold) {
  if (Array.isArray(threshold)) {
    if (weight < threshold[0]) {
      return 0;
    }

    return weight < threshold[1] ? 1 : 2;
  }

  return weight >= threshold ? 1 : 0;
}

export function getCode(opts) {
  const {
    cellWeights,
    x,
    y,
    width,
    height
  } = opts;
  let threshold = opts.threshold;

  if (opts.thresholdValue) {
    log.deprecated('thresholdValue', 'threshold')();
    threshold = opts.thresholdValue;
  }

  const isLeftBoundary = x < 0;
  const isRightBoundary = x >= width - 1;
  const isBottomBoundary = y < 0;
  const isTopBoundary = y >= height - 1;
  const isBoundary = isLeftBoundary || isRightBoundary || isBottomBoundary || isTopBoundary;
  const weights = {};
  const codes = {};

  if (isLeftBoundary || isTopBoundary) {
    codes.top = 0;
  } else {
    weights.top = cellWeights[(y + 1) * width + x];
    codes.top = getVertexCode(weights.top, threshold);
  }

  if (isRightBoundary || isTopBoundary) {
    codes.topRight = 0;
  } else {
    weights.topRight = cellWeights[(y + 1) * width + x + 1];
    codes.topRight = getVertexCode(weights.topRight, threshold);
  }

  if (isRightBoundary || isBottomBoundary) {
    codes.right = 0;
  } else {
    weights.right = cellWeights[y * width + x + 1];
    codes.right = getVertexCode(weights.right, threshold);
  }

  if (isLeftBoundary || isBottomBoundary) {
    codes.current = 0;
  } else {
    weights.current = cellWeights[y * width + x];
    codes.current = getVertexCode(weights.current, threshold);
  }

  const {
    top,
    topRight,
    right,
    current
  } = codes;
  let code = -1;

  if (Number.isFinite(threshold)) {
    code = top << 3 | topRight << 2 | right << 1 | current;
  }

  if (Array.isArray(threshold)) {
    code = top << 6 | topRight << 4 | right << 2 | current;
  }

  let meanCode = 0;

  if (!isBoundary) {
    meanCode = getVertexCode((weights.top + weights.topRight + weights.right + weights.current) / 4, threshold);
  }

  return {
    code,
    meanCode
  };
}
export function getVertices(opts) {
  const {
    gridOrigin,
    cellSize,
    x,
    y,
    code,
    meanCode,
    type = CONTOUR_TYPE.ISO_LINES
  } = opts;
  const thresholdData = Object.assign({}, DEFAULT_THRESHOLD_DATA, opts.thresholdData);
  let offsets = type === CONTOUR_TYPE.ISO_BANDS ? ISOBANDS_CODE_OFFSET_MAP[code] : ISOLINES_CODE_OFFSET_MAP[code];

  if (!Array.isArray(offsets)) {
    offsets = offsets[meanCode];
  }

  const vZ = thresholdData.zIndex * thresholdData.zOffset;
  const rX = (x + 1) * cellSize[0];
  const rY = (y + 1) * cellSize[1];
  const refVertexX = gridOrigin[0] + rX;
  const refVertexY = gridOrigin[1] + rY;

  if (type === CONTOUR_TYPE.ISO_BANDS) {
    const polygons = [];
    offsets.forEach(polygonOffsets => {
      const polygon = [];
      polygonOffsets.forEach(xyOffset => {
        const vX = refVertexX + xyOffset[0] * cellSize[0];
        const vY = refVertexY + xyOffset[1] * cellSize[1];
        polygon.push([vX, vY, vZ]);
      });
      polygons.push(polygon);
    });
    return polygons;
  }

  const lines = [];
  offsets.forEach(xyOffsets => {
    xyOffsets.forEach(offset => {
      const vX = refVertexX + offset[0] * cellSize[0];
      const vY = refVertexY + offset[1] * cellSize[1];
      lines.push([vX, vY, vZ]);
    });
  });
  return lines;
}
//# sourceMappingURL=marching-squares.js.map