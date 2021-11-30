import { COORDINATE_SYSTEM } from '../../lib/constants';
import { LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD } from './viewport-uniforms';
import * as vec4 from 'gl-matrix/vec4';
import * as vec3 from 'gl-matrix/vec3';
import { getDistanceScales, addMetersToLngLat } from 'viewport-mercator-project';

function lngLatZToWorldPosition(lngLatZ, viewport) {
  let offsetMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const [longitude, latitude, z = 0] = lngLatZ;
  const [X, Y] = viewport.projectFlat(lngLatZ);
  const distanceScales = offsetMode ? getDistanceScales({
    longitude,
    latitude,
    scale: viewport.scale
  }) : viewport.getDistanceScales();
  const Z = z * distanceScales.pixelsPerMeter[2];
  return [X, Y, Z];
}

function normalizeParameters(opts) {
  const normalizedParams = Object.assign({}, opts);
  const {
    viewport,
    coordinateSystem,
    coordinateOrigin,
    fromCoordinateSystem,
    fromCoordinateOrigin
  } = opts;

  if (fromCoordinateSystem === undefined) {
    normalizedParams.fromCoordinateSystem = coordinateSystem;
  }

  if (fromCoordinateOrigin === undefined) {
    normalizedParams.fromCoordinateOrigin = coordinateOrigin;
  }

  if (coordinateSystem === COORDINATE_SYSTEM.LNGLAT && viewport.zoom >= LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
    normalizedParams.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;
    normalizedParams.coordinateOrigin = [Math.fround(viewport.longitude), Math.fround(viewport.latitude)];
  }

  return normalizedParams;
}

export function getWorldPosition(position, _ref) {
  let {
    viewport,
    modelMatrix,
    coordinateSystem,
    coordinateOrigin,
    offsetMode
  } = _ref;
  let [x, y, z] = position;

  if (modelMatrix) {
    [x, y, z] = vec4.transformMat4([], [x, y, z, 1.0], modelMatrix);
  }

  switch (coordinateSystem) {
    case COORDINATE_SYSTEM.LNGLAT:
    case COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
      return lngLatZToWorldPosition([x, y, z], viewport, offsetMode);

    case COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      return lngLatZToWorldPosition([x + coordinateOrigin[0], y + coordinateOrigin[1], z + (coordinateOrigin[2] || 0)], viewport, offsetMode);

    case COORDINATE_SYSTEM.METER_OFFSETS:
      return lngLatZToWorldPosition(addMetersToLngLat(coordinateOrigin, [x, y, z]), viewport, offsetMode);

    case COORDINATE_SYSTEM.IDENTITY:
    default:
      return viewport.projectPosition([x, y, z]);
  }
}
export function projectPosition(position, params) {
  const {
    viewport,
    coordinateSystem,
    coordinateOrigin,
    modelMatrix,
    fromCoordinateSystem,
    fromCoordinateOrigin
  } = normalizeParameters(params);

  switch (coordinateSystem) {
    case COORDINATE_SYSTEM.LNGLAT_OFFSETS:
    case COORDINATE_SYSTEM.METER_OFFSETS:
      {
        const worldPosition = getWorldPosition(position, {
          viewport,
          modelMatrix,
          coordinateSystem: fromCoordinateSystem,
          coordinateOrigin: fromCoordinateOrigin,
          offsetMode: true
        });
        const originWorld = lngLatZToWorldPosition(coordinateOrigin, viewport, true);
        vec3.sub(worldPosition, worldPosition, originWorld);
        return worldPosition;
      }

    case COORDINATE_SYSTEM.LNGLAT:
    case COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
    case COORDINATE_SYSTEM.IDENTITY:
    default:
      return getWorldPosition(position, {
        viewport,
        modelMatrix,
        coordinateSystem: fromCoordinateSystem,
        coordinateOrigin: fromCoordinateOrigin,
        offsetMode: false
      });
  }
}
//# sourceMappingURL=project-functions.js.map