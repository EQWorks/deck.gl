import { lngLatToWorld } from 'viewport-mercator-project';
const TILE_SIZE = 512;

function getBoundingBox(viewport) {
  const corners = [viewport.unproject([0, 0]), viewport.unproject([viewport.width, 0]), viewport.unproject([0, viewport.height]), viewport.unproject([viewport.width, viewport.height])];
  return [corners.reduce((minLng, p) => minLng < p[0] ? minLng : p[0], 180), corners.reduce((minLat, p) => minLat < p[1] ? minLat : p[1], 90), corners.reduce((maxLng, p) => maxLng > p[0] ? maxLng : p[0], -180), corners.reduce((maxLat, p) => maxLat > p[1] ? maxLat : p[1], -90)];
}

function pixelsToTileIndex(a) {
  return a / TILE_SIZE;
}

export function getTileIndices(viewport, maxZoom, minZoom) {
  const z = Math.floor(viewport.zoom);

  if (minZoom && z < minZoom) {
    return [];
  }

  viewport = new viewport.constructor(Object.assign({}, viewport, {
    zoom: z
  }));
  const bbox = getBoundingBox(viewport);
  let [minX, minY] = lngLatToWorld([bbox[0], bbox[3]], viewport.scale).map(pixelsToTileIndex);
  let [maxX, maxY] = lngLatToWorld([bbox[2], bbox[1]], viewport.scale).map(pixelsToTileIndex);
  minX = Math.max(0, Math.floor(minX));
  maxX = Math.min(viewport.scale, Math.ceil(maxX));
  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(viewport.scale, Math.ceil(maxY));
  const indices = [];

  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (maxZoom && z > maxZoom) {
        indices.push(getAdjustedTileIndex({
          x,
          y,
          z
        }, maxZoom));
      } else {
        indices.push({
          x,
          y,
          z
        });
      }
    }
  }

  return indices;
}

function getAdjustedTileIndex(_ref, adjustedZ) {
  let {
    x,
    y,
    z
  } = _ref;
  const m = Math.pow(2, z - adjustedZ);
  return {
    x: Math.floor(x / m),
    y: Math.floor(y / m),
    z: adjustedZ
  };
}
//# sourceMappingURL=viewport-util.js.map