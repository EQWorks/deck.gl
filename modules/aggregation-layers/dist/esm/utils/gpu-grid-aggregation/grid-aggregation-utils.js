import { Matrix4 } from 'math.gl';
import { fp64 as fp64Utils } from 'kepler-outdated-luma.gl-core';
import { COORDINATE_SYSTEM, log, createIterable, experimental } from 'kepler-outdated-deck.gl-core';
const {
  count
} = experimental;
const {
  fp64LowPart
} = fp64Utils;
const R_EARTH = 6378000;

function toFinite(n) {
  return Number.isFinite(n) ? n : 0;
}

export function pointToDensityGridData(_ref) {
  let {
    data,
    getPosition,
    cellSizeMeters,
    gpuGridAggregator,
    gpuAggregation,
    aggregationFlags,
    weightParams,
    fp64 = false,
    coordinateSystem = COORDINATE_SYSTEM.LNGLAT,
    viewport = null,
    boundingBox = null
  } = _ref;
  let gridData = {};

  if (aggregationFlags.dataChanged) {
    gridData = parseGridData(data, getPosition, weightParams);
    boundingBox = gridData.boundingBox;
  }

  let cellSize = [cellSizeMeters, cellSizeMeters];
  let worldOrigin = [0, 0];
  log.assert(coordinateSystem === COORDINATE_SYSTEM.LNGLAT || coordinateSystem === COORDINATE_SYSTEM.IDENTITY);

  switch (coordinateSystem) {
    case COORDINATE_SYSTEM.LNGLAT:
    case COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
      const gridOffset = getGridOffset(boundingBox, cellSizeMeters);
      cellSize = [gridOffset.xOffset, gridOffset.yOffset];
      worldOrigin = [-180, -90];
      break;

    case COORDINATE_SYSTEM.IDENTITY:
      const {
        width,
        height
      } = viewport;
      worldOrigin = [-width / 2, -height / 2];
      break;

    default:
      log.assert(false);
  }

  const opts = getGPUAggregationParams({
    boundingBox,
    cellSize,
    worldOrigin
  });
  const aggregatedData = gpuGridAggregator.run({
    positions: gridData.positions,
    positions64xyLow: gridData.positions64xyLow,
    weights: gridData.weights,
    cellSize,
    width: opts.width,
    height: opts.height,
    gridTransformMatrix: opts.gridTransformMatrix,
    useGPU: gpuAggregation,
    changeFlags: aggregationFlags,
    fp64
  });
  return {
    weights: aggregatedData,
    gridSize: opts.gridSize,
    gridOrigin: opts.gridOrigin,
    cellSize,
    boundingBox
  };
}

function parseGridData(data, getPosition, weightParams) {
  const pointCount = count(data);
  const positions = new Float64Array(pointCount * 2);
  const positions64xyLow = new Float32Array(pointCount * 2);
  let yMin = Infinity;
  let yMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  let y;
  let x;
  const weights = {};

  for (const name in weightParams) {
    weights[name] = Object.assign({}, weightParams[name], {
      values: new Float32Array(pointCount * 3)
    });
  }

  const {
    iterable,
    objectInfo
  } = createIterable(data);

  for (const object of iterable) {
    objectInfo.index++;
    const position = getPosition(object, objectInfo);
    const {
      index
    } = objectInfo;
    x = position[0];
    y = position[1];
    positions[index * 2] = x;
    positions[index * 2 + 1] = y;
    positions64xyLow[index * 2] = fp64LowPart(x);
    positions64xyLow[index * 2 + 1] = fp64LowPart(y);

    for (const name in weightParams) {
      const weight = weightParams[name].getWeight(object);

      if (Array.isArray(weight)) {
        weights[name].values[index * 3] = weight[0];
        weights[name].values[index * 3 + 1] = weight[1];
        weights[name].values[index * 3 + 2] = weight[2];
      } else {
        weights[name].values[index * 3] = weight;
      }
    }

    if (Number.isFinite(y) && Number.isFinite(x)) {
      yMin = y < yMin ? y : yMin;
      yMax = y > yMax ? y : yMax;
      xMin = x < xMin ? x : xMin;
      xMax = x > xMax ? x : xMax;
    }
  }

  const boundingBox = {
    xMin: toFinite(xMin),
    xMax: toFinite(xMax),
    yMin: toFinite(yMin),
    yMax: toFinite(yMax)
  };
  return {
    positions,
    positions64xyLow,
    weights,
    boundingBox
  };
}

function getGridOffset(boundingBox, cellSize) {
  const {
    yMin,
    yMax
  } = boundingBox;
  const latMin = yMin;
  const latMax = yMax;
  const centerLat = (latMin + latMax) / 2;
  return calculateGridLatLonOffset(cellSize, centerLat);
}

function calculateGridLatLonOffset(cellSize, latitude) {
  const yOffset = calculateLatOffset(cellSize);
  const xOffset = calculateLonOffset(latitude, cellSize);
  return {
    yOffset,
    xOffset
  };
}

function calculateLatOffset(dy) {
  return dy / R_EARTH * (180 / Math.PI);
}

function calculateLonOffset(lat, dx) {
  return dx / R_EARTH * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
}

export function alignToCell(inValue, cellSize) {
  const sign = inValue < 0 ? -1 : 1;
  let value = sign < 0 ? Math.abs(inValue) + cellSize : Math.abs(inValue);
  value = Math.floor(value / cellSize) * cellSize;
  return value * sign;
}

function getGPUAggregationParams(_ref2) {
  let {
    boundingBox,
    cellSize,
    worldOrigin
  } = _ref2;
  const {
    yMin,
    yMax,
    xMin,
    xMax
  } = boundingBox;
  const originX = alignToCell(xMin - worldOrigin[0], cellSize[0]) + worldOrigin[0];
  const originY = alignToCell(yMin - worldOrigin[1], cellSize[1]) + worldOrigin[1];
  const gridTransformMatrix = new Matrix4().translate([-1 * originX, -1 * originY, 0]);
  const gridOrigin = [originX, originY];
  const width = xMax - xMin + cellSize[0];
  const height = yMax - yMin + cellSize[1];
  const gridSize = [Math.ceil(width / cellSize[0]), Math.ceil(height / cellSize[1])];
  return {
    gridOrigin,
    gridSize,
    width,
    height,
    gridTransformMatrix
  };
}
//# sourceMappingURL=grid-aggregation-utils.js.map