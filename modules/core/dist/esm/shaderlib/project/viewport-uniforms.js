import * as mat4 from 'gl-matrix/mat4';
import * as vec4 from 'gl-matrix/vec4';
import { COORDINATE_SYSTEM } from '../../lib/constants';
import memoize from '../../utils/memoize';
import assert from '../../utils/assert';
import { PROJECT_COORDINATE_SYSTEM } from './constants';
const ZERO_VECTOR = [0, 0, 0, 0];
const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const DEFAULT_PIXELS_PER_UNIT2 = [0, 0, 0];
const DEFAULT_COORDINATE_ORIGIN = [0, 0, 0];
export const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 12;
const getMemoizedViewportUniforms = memoize(calculateViewportUniforms);

function getShaderCoordinateSystem(coordinateSystem) {
  switch (coordinateSystem) {
    case COORDINATE_SYSTEM.LNGLAT:
    case COORDINATE_SYSTEM.LNGLAT_EXPERIMENTAL:
    default:
      return PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET;

    case COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
      return PROJECT_COORDINATE_SYSTEM.LNG_LAT;

    case COORDINATE_SYSTEM.METER_OFFSETS:
    case COORDINATE_SYSTEM.METERS:
      return PROJECT_COORDINATE_SYSTEM.METER_OFFSETS;

    case COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      return PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS;

    case COORDINATE_SYSTEM.IDENTITY:
      return PROJECT_COORDINATE_SYSTEM.IDENTITY;
  }
}

function calculateMatrixAndOffset(_ref) {
  let {
    viewport,
    coordinateSystem,
    coordinateOrigin,
    coordinateZoom
  } = _ref;
  const {
    viewMatrixUncentered
  } = viewport;
  let {
    viewMatrix
  } = viewport;
  const {
    projectionMatrix
  } = viewport;
  let {
    viewProjectionMatrix
  } = viewport;
  let projectionCenter;
  let cameraPosCommon = viewport.cameraPosition;
  let shaderCoordinateSystem = getShaderCoordinateSystem(coordinateSystem);
  let shaderCoordinateOrigin = coordinateOrigin;

  if (shaderCoordinateSystem === PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET) {
    if (coordinateZoom < LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
      shaderCoordinateSystem = PROJECT_COORDINATE_SYSTEM.LNG_LAT;
    } else {
      const lng = Math.fround(viewport.longitude);
      const lat = Math.fround(viewport.latitude);
      shaderCoordinateOrigin = [lng, lat];
    }
  }

  if (shaderCoordinateSystem === PROJECT_COORDINATE_SYSTEM.IDENTITY) {
    shaderCoordinateOrigin = [Math.fround(viewport.position[0]), Math.fround(viewport.position[1])];
  }

  shaderCoordinateOrigin[2] = shaderCoordinateOrigin[2] || 0;

  switch (shaderCoordinateSystem) {
    case PROJECT_COORDINATE_SYSTEM.LNG_LAT:
      projectionCenter = ZERO_VECTOR;
      break;

    case PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS:
    case PROJECT_COORDINATE_SYSTEM.METER_OFFSETS:
    case PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET:
    case PROJECT_COORDINATE_SYSTEM.IDENTITY:
      const positionCommonSpace = viewport.projectPosition(shaderCoordinateOrigin, Math.pow(2, coordinateZoom));
      cameraPosCommon = [cameraPosCommon[0] - positionCommonSpace[0], cameraPosCommon[1] - positionCommonSpace[1], cameraPosCommon[2] - positionCommonSpace[2]];
      positionCommonSpace[3] = 1;
      projectionCenter = vec4.transformMat4([], positionCommonSpace, viewProjectionMatrix);
      viewMatrix = viewMatrixUncentered || viewMatrix;
      viewProjectionMatrix = mat4.multiply([], projectionMatrix, viewMatrix);
      viewProjectionMatrix = mat4.multiply([], viewProjectionMatrix, VECTOR_TO_POINT_MATRIX);
      break;

    default:
      throw new Error('Unknown projection mode');
  }

  return {
    viewMatrix,
    viewProjectionMatrix,
    projectionCenter,
    cameraPosCommon,
    shaderCoordinateSystem,
    shaderCoordinateOrigin
  };
}

export function getUniformsFromViewport() {
  let {
    viewport,
    devicePixelRatio = 1,
    modelMatrix = null,
    coordinateSystem = COORDINATE_SYSTEM.LNGLAT,
    coordinateOrigin = DEFAULT_COORDINATE_ORIGIN,
    wrapLongitude = false,
    projectionMode,
    positionOrigin
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  assert(viewport);
  return Object.assign({
    project_uModelMatrix: modelMatrix || IDENTITY_MATRIX
  }, getMemoizedViewportUniforms({
    viewport,
    devicePixelRatio,
    coordinateSystem,
    coordinateOrigin,
    wrapLongitude
  }));
}

function calculateViewportUniforms(_ref2) {
  let {
    viewport,
    devicePixelRatio,
    coordinateSystem,
    coordinateOrigin,
    wrapLongitude
  } = _ref2;
  const coordinateZoom = viewport.zoom;
  const {
    projectionCenter,
    viewProjectionMatrix,
    cameraPosCommon,
    shaderCoordinateSystem,
    shaderCoordinateOrigin
  } = calculateMatrixAndOffset({
    coordinateSystem,
    coordinateOrigin,
    coordinateZoom,
    viewport
  });
  assert(viewProjectionMatrix, 'Viewport missing modelViewProjectionMatrix');
  const distanceScales = viewport.getDistanceScales();
  const viewportSize = [viewport.width * devicePixelRatio, viewport.height * devicePixelRatio];
  const uniforms = {
    project_uCoordinateSystem: shaderCoordinateSystem,
    project_uCenter: projectionCenter,
    project_uWrapLongitude: wrapLongitude,
    project_uAntimeridian: (viewport.longitude || 0) - 180,
    project_uViewportSize: viewportSize,
    project_uDevicePixelRatio: devicePixelRatio,
    project_uFocalDistance: viewport.focalDistance || 1,
    project_uCommonUnitsPerMeter: distanceScales.pixelsPerMeter,
    project_uCommonUnitsPerWorldUnit: distanceScales.pixelsPerMeter,
    project_uCommonUnitsPerWorldUnit2: DEFAULT_PIXELS_PER_UNIT2,
    project_uScale: viewport.scale,
    project_uViewProjectionMatrix: viewProjectionMatrix,
    project_uCameraPosition: cameraPosCommon
  };
  const distanceScalesAtOrigin = viewport.getDistanceScales(shaderCoordinateOrigin);

  switch (shaderCoordinateSystem) {
    case PROJECT_COORDINATE_SYSTEM.METER_OFFSETS:
      uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.pixelsPerMeter;
      uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.pixelsPerMeter2;
      break;

    case PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET:
      uniforms.project_uCoordinateOrigin = shaderCoordinateOrigin;

    case PROJECT_COORDINATE_SYSTEM.LNG_LAT:
    case PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.pixelsPerDegree;
      uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.pixelsPerDegree2;
      break;

    case PROJECT_COORDINATE_SYSTEM.IDENTITY:
      uniforms.project_uCoordinateOrigin = shaderCoordinateOrigin;
      break;

    default:
      break;
  }

  return uniforms;
}
//# sourceMappingURL=viewport-uniforms.js.map