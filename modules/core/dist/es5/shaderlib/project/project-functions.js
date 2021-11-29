"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWorldPosition = getWorldPosition;
exports.projectPosition = projectPosition;

var _constants = require("../../lib/constants");

var _viewportUniforms = require("./viewport-uniforms");

var vec4 = _interopRequireWildcard(require("gl-matrix/vec4"));

var vec3 = _interopRequireWildcard(require("gl-matrix/vec3"));

var _viewportMercatorProject = require("viewport-mercator-project");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function lngLatZToWorldPosition(lngLatZ, viewport) {
  let offsetMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const [longitude, latitude, z = 0] = lngLatZ;
  const [X, Y] = viewport.projectFlat(lngLatZ);
  const distanceScales = offsetMode ? (0, _viewportMercatorProject.getDistanceScales)({
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

  if (coordinateSystem === _constants.COORDINATE_SYSTEM.LNGLAT && viewport.zoom >= _viewportUniforms.LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
    normalizedParams.coordinateSystem = _constants.COORDINATE_SYSTEM.LNGLAT_OFFSETS;
    normalizedParams.coordinateOrigin = [Math.fround(viewport.longitude), Math.fround(viewport.latitude)];
  }

  return normalizedParams;
}

function getWorldPosition(position, _ref) {
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
    case _constants.COORDINATE_SYSTEM.LNGLAT:
    case _constants.COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
      return lngLatZToWorldPosition([x, y, z], viewport, offsetMode);

    case _constants.COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      return lngLatZToWorldPosition([x + coordinateOrigin[0], y + coordinateOrigin[1], z + (coordinateOrigin[2] || 0)], viewport, offsetMode);

    case _constants.COORDINATE_SYSTEM.METER_OFFSETS:
      return lngLatZToWorldPosition((0, _viewportMercatorProject.addMetersToLngLat)(coordinateOrigin, [x, y, z]), viewport, offsetMode);

    case _constants.COORDINATE_SYSTEM.IDENTITY:
    default:
      return viewport.projectPosition([x, y, z]);
  }
}

function projectPosition(position, params) {
  const {
    viewport,
    coordinateSystem,
    coordinateOrigin,
    modelMatrix,
    fromCoordinateSystem,
    fromCoordinateOrigin
  } = normalizeParameters(params);

  switch (coordinateSystem) {
    case _constants.COORDINATE_SYSTEM.LNGLAT_OFFSETS:
    case _constants.COORDINATE_SYSTEM.METER_OFFSETS:
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

    case _constants.COORDINATE_SYSTEM.LNGLAT:
    case _constants.COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
    case _constants.COORDINATE_SYSTEM.IDENTITY:
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