"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _viewport = _interopRequireDefault(require("./viewport"));

var _viewportMercatorProject = require("viewport-mercator-project");

var vec2 = _interopRequireWildcard(require("gl-matrix/vec2"));

var _assert = _interopRequireDefault(require("../utils/assert"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const ERR_ARGUMENT = 'Illegal argument to WebMercatorViewport';

class WebMercatorViewport extends _viewport.default {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      latitude = 0,
      longitude = 0,
      zoom = 11,
      pitch = 0,
      bearing = 0,
      nearZMultiplier = 0.1,
      farZMultiplier = 10,
      orthographic = false
    } = opts;
    let {
      width,
      height,
      altitude = 1.5
    } = opts;
    width = width || 1;
    height = height || 1;
    altitude = Math.max(0.75, altitude);
    const {
      fov,
      aspect,
      focalDistance,
      near,
      far
    } = (0, _viewportMercatorProject.getProjectionParameters)({
      width,
      height,
      pitch,
      altitude,
      nearZMultiplier,
      farZMultiplier
    });
    const viewMatrixUncentered = (0, _viewportMercatorProject.getViewMatrix)({
      height,
      pitch,
      bearing,
      altitude
    });
    const viewportOpts = Object.assign({}, opts, {
      width,
      height,
      viewMatrix: viewMatrixUncentered,
      longitude,
      latitude,
      zoom,
      orthographic,
      fovyRadians: fov,
      aspect,
      orthographicFocalDistance: focalDistance,
      near,
      far
    });
    super(viewportOpts);
    this.latitude = latitude;
    this.longitude = longitude;
    this.zoom = zoom;
    this.pitch = pitch;
    this.bearing = bearing;
    this.altitude = altitude;
    this.orthographic = orthographic;
    this.metersToLngLatDelta = this.metersToLngLatDelta.bind(this);
    this.lngLatDeltaToMeters = this.lngLatDeltaToMeters.bind(this);
    this.addMetersToLngLat = this.addMetersToLngLat.bind(this);
    Object.freeze(this);
  }

  metersToLngLatDelta(xyz) {
    const [x, y, z = 0] = xyz;
    (0, _assert.default)(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z), ERR_ARGUMENT);
    const {
      pixelsPerMeter,
      degreesPerPixel
    } = this.distanceScales;
    const deltaLng = x * pixelsPerMeter[0] * degreesPerPixel[0];
    const deltaLat = y * pixelsPerMeter[1] * degreesPerPixel[1];
    return xyz.length === 2 ? [deltaLng, deltaLat] : [deltaLng, deltaLat, z];
  }

  lngLatDeltaToMeters(deltaLngLatZ) {
    const [deltaLng, deltaLat, deltaZ = 0] = deltaLngLatZ;
    (0, _assert.default)(Number.isFinite(deltaLng) && Number.isFinite(deltaLat) && Number.isFinite(deltaZ), ERR_ARGUMENT);
    const {
      pixelsPerDegree,
      metersPerPixel
    } = this.distanceScales;
    const deltaX = deltaLng * pixelsPerDegree[0] * metersPerPixel[0];
    const deltaY = deltaLat * pixelsPerDegree[1] * metersPerPixel[1];
    return deltaLngLatZ.length === 2 ? [deltaX, deltaY] : [deltaX, deltaY, deltaZ];
  }

  addMetersToLngLat(lngLatZ, xyz) {
    return (0, _viewportMercatorProject.addMetersToLngLat)(lngLatZ, xyz);
  }

  getMapCenterByLngLatPosition(_ref) {
    let {
      lngLat,
      pos
    } = _ref;
    const fromLocation = (0, _viewportMercatorProject.pixelsToWorld)(pos, this.pixelUnprojectionMatrix);
    const toLocation = this.projectFlat(lngLat);
    const translate = vec2.add([], toLocation, vec2.negate([], fromLocation));
    const newCenter = vec2.add([], this.center, translate);
    return this.unprojectFlat(newCenter);
  }

  getLocationAtPoint(_ref2) {
    let {
      lngLat,
      pos
    } = _ref2;
    return this.getMapCenterByLngLatPosition({
      lngLat,
      pos
    });
  }

  fitBounds(bounds) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const {
      width,
      height
    } = this;
    const {
      longitude,
      latitude,
      zoom
    } = (0, _viewportMercatorProject.fitBounds)(Object.assign({
      width,
      height,
      bounds
    }, options));
    return new WebMercatorViewport({
      width,
      height,
      longitude,
      latitude,
      zoom
    });
  }

}

exports.default = WebMercatorViewport;
WebMercatorViewport.displayName = 'WebMercatorViewport';
//# sourceMappingURL=web-mercator-viewport.js.map