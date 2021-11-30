import { S2 } from 's2-geometry';

function getLevelFromToken(token) {
  const lastHex = token.substr(token.length - 1);
  const level = 2 * (token.length - 1) - ((lastHex & 1) === 0);
  return level;
}

function getIdFromToken(token) {
  const paddedToken = token.padEnd(16, '0');
  return String(parseInt(paddedToken, 16));
}

const RADIAN_TO_DEGREE = 180 / Math.PI;
const MAX_RESOLUTION = 100;

function XYZToLngLat(_ref) {
  let [x, y, z] = _ref;
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = Math.atan2(y, x);
  return [lng * RADIAN_TO_DEGREE, lat * RADIAN_TO_DEGREE];
}

function getGeoBounds(_ref2) {
  let {
    face,
    ij,
    level
  } = _ref2;
  const result = [];
  const offsets = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
  const resolution = Math.max(1, MAX_RESOLUTION * Math.pow(2, -level));

  for (let i = 0; i < 4; i++) {
    const offset = offsets[i].slice(0);
    const nextOffset = offsets[i + 1];
    const stepI = (nextOffset[0] - offset[0]) / resolution;
    const stepJ = (nextOffset[1] - offset[1]) / resolution;

    for (let j = 0; j < resolution; j++) {
      offset[0] += stepI;
      offset[1] += stepJ;
      const st = S2.IJToST(ij, level, offset);
      const uv = S2.STToUV(st);
      const xyz = S2.FaceUVToXYZ(face, uv);
      result.push(XYZToLngLat(xyz));
    }
  }

  return result;
}

export function getS2Polygon(token) {
  const id = getIdFromToken(token);
  const level = getLevelFromToken(token);
  const s2cell = S2.S2Cell.FromLatLng(S2.idToLatLng(id), level);
  return getGeoBounds(s2cell);
}
//# sourceMappingURL=s2-utils.js.map