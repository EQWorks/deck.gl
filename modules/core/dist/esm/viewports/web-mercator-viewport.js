import Viewport from './viewport';
import { pixelsToWorld, getViewMatrix, addMetersToLngLat, getProjectionParameters, fitBounds } from 'viewport-mercator-project';
import * as vec2 from 'gl-matrix/vec2';
import assert from '../utils/assert';
const ERR_ARGUMENT = 'Illegal argument to WebMercatorViewport';
export default class WebMercatorViewport extends Viewport {
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
    } = getProjectionParameters({
      width,
      height,
      pitch,
      altitude,
      nearZMultiplier,
      farZMultiplier
    });
    const viewMatrixUncentered = getViewMatrix({
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
    assert(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z), ERR_ARGUMENT);
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
    assert(Number.isFinite(deltaLng) && Number.isFinite(deltaLat) && Number.isFinite(deltaZ), ERR_ARGUMENT);
    const {
      pixelsPerDegree,
      metersPerPixel
    } = this.distanceScales;
    const deltaX = deltaLng * pixelsPerDegree[0] * metersPerPixel[0];
    const deltaY = deltaLat * pixelsPerDegree[1] * metersPerPixel[1];
    return deltaLngLatZ.length === 2 ? [deltaX, deltaY] : [deltaX, deltaY, deltaZ];
  }

  addMetersToLngLat(lngLatZ, xyz) {
    return addMetersToLngLat(lngLatZ, xyz);
  }

  getMapCenterByLngLatPosition(_ref) {
    let {
      lngLat,
      pos
    } = _ref;
    const fromLocation = pixelsToWorld(pos, this.pixelUnprojectionMatrix);
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
    } = fitBounds(Object.assign({
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
WebMercatorViewport.displayName = 'WebMercatorViewport';
//# sourceMappingURL=web-mercator-viewport.js.map