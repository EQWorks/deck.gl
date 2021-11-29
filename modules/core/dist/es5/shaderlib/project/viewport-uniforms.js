"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = void 0;
exports.getUniformsFromViewport = getUniformsFromViewport;

var mat4 = _interopRequireWildcard(require("gl-matrix/mat4"));

var vec4 = _interopRequireWildcard(require("gl-matrix/vec4"));

var _constants = require("../../lib/constants");

var _memoize = _interopRequireDefault(require("../../utils/memoize"));

var _assert = _interopRequireDefault(require("../../utils/assert"));

var _constants2 = require("./constants");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const ZERO_VECTOR = [0, 0, 0, 0];
const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const DEFAULT_PIXELS_PER_UNIT2 = [0, 0, 0];
const DEFAULT_COORDINATE_ORIGIN = [0, 0, 0];
const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 12;
exports.LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD;
const getMemoizedViewportUniforms = (0, _memoize.default)(calculateViewportUniforms);

function getShaderCoordinateSystem(coordinateSystem) {
  switch (coordinateSystem) {
    case _constants.COORDINATE_SYSTEM.LNGLAT:
    case _constants.COORDINATE_SYSTEM.LNGLAT_EXPERIMENTAL:
    default:
      return _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET;

    case _constants.COORDINATE_SYSTEM.LNGLAT_DEPRECATED:
      return _constants2.PROJECT_COORDINATE_SYSTEM.LNG_LAT;

    case _constants.COORDINATE_SYSTEM.METER_OFFSETS:
    case _constants.COORDINATE_SYSTEM.METERS:
      return _constants2.PROJECT_COORDINATE_SYSTEM.METER_OFFSETS;

    case _constants.COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      return _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS;

    case _constants.COORDINATE_SYSTEM.IDENTITY:
      return _constants2.PROJECT_COORDINATE_SYSTEM.IDENTITY;
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

  if (shaderCoordinateSystem === _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET) {
    if (coordinateZoom < LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
      shaderCoordinateSystem = _constants2.PROJECT_COORDINATE_SYSTEM.LNG_LAT;
    } else {
      const lng = Math.fround(viewport.longitude);
      const lat = Math.fround(viewport.latitude);
      shaderCoordinateOrigin = [lng, lat];
    }
  }

  if (shaderCoordinateSystem === _constants2.PROJECT_COORDINATE_SYSTEM.IDENTITY) {
    shaderCoordinateOrigin = [Math.fround(viewport.position[0]), Math.fround(viewport.position[1])];
  }

  shaderCoordinateOrigin[2] = shaderCoordinateOrigin[2] || 0;

  switch (shaderCoordinateSystem) {
    case _constants2.PROJECT_COORDINATE_SYSTEM.LNG_LAT:
      projectionCenter = ZERO_VECTOR;
      break;

    case _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS:
    case _constants2.PROJECT_COORDINATE_SYSTEM.METER_OFFSETS:
    case _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET:
    case _constants2.PROJECT_COORDINATE_SYSTEM.IDENTITY:
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

function getUniformsFromViewport() {
  let {
    viewport,
    devicePixelRatio = 1,
    modelMatrix = null,
    coordinateSystem = _constants.COORDINATE_SYSTEM.LNGLAT,
    coordinateOrigin = DEFAULT_COORDINATE_ORIGIN,
    wrapLongitude = false,
    projectionMode,
    positionOrigin
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  (0, _assert.default)(viewport);
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
  (0, _assert.default)(viewProjectionMatrix, 'Viewport missing modelViewProjectionMatrix');
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
    case _constants2.PROJECT_COORDINATE_SYSTEM.METER_OFFSETS:
      uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.pixelsPerMeter;
      uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.pixelsPerMeter2;
      break;

    case _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_AUTO_OFFSET:
      uniforms.project_uCoordinateOrigin = shaderCoordinateOrigin;

    case _constants2.PROJECT_COORDINATE_SYSTEM.LNG_LAT:
    case _constants2.PROJECT_COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.pixelsPerDegree;
      uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.pixelsPerDegree2;
      break;

    case _constants2.PROJECT_COORDINATE_SYSTEM.IDENTITY:
      uniforms.project_uCoordinateOrigin = shaderCoordinateOrigin;
      break;

    default:
      break;
  }

  return uniforms;
}
//# sourceMappingURL=viewport-uniforms.js.map