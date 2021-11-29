import log from '../utils/log';
import { createMat4, extractCameraVectors } from '../utils/math-utils';
import { Matrix4, Vector3, equals } from 'math.gl';
import * as mat4 from 'gl-matrix/mat4';
import { getDistanceScales, getMeterZoom, lngLatToWorld, worldToLngLat, worldToPixels, pixelsToWorld } from 'viewport-mercator-project';
import assert from '../utils/assert';
const DEGREES_TO_RADIANS = Math.PI / 180;
const IDENTITY = createMat4();
const ZERO_VECTOR = [0, 0, 0];
const DEFAULT_ZOOM = 0;
const ERR_ARGUMENT = 'Illegal argument to Viewport';
export default class Viewport {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = null,
      x = 0,
      y = 0,
      width = 1,
      height = 1
    } = opts;
    this.id = id || this.constructor.displayName || 'viewport';
    this.x = x;
    this.y = y;
    this.width = width || 1;
    this.height = height || 1;

    this._initViewMatrix(opts);

    this._initProjectionMatrix(opts);

    this._initPixelMatrices();

    this.equals = this.equals.bind(this);
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectPosition = this.projectPosition.bind(this);
    this.unprojectPosition = this.unprojectPosition.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.getMatrices = this.getMatrices.bind(this);
  }

  equals(viewport) {
    if (!(viewport instanceof Viewport)) {
      return false;
    }

    return viewport.width === this.width && viewport.height === this.height && viewport.scale === this.scale && equals(viewport.projectionMatrix, this.projectionMatrix) && equals(viewport.viewMatrix, this.viewMatrix);
  }

  project(xyz) {
    let {
      topLeft = true
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const worldPosition = this.projectPosition(xyz);
    const coord = worldToPixels(worldPosition, this.pixelProjectionMatrix);
    const [x, y] = coord;
    const y2 = topLeft ? y : this.height - y;
    return xyz.length === 2 ? [x, y2] : [x, y2, coord[2]];
  }

  unproject(xyz) {
    let {
      topLeft = true,
      targetZ
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const [x, y, z] = xyz;
    const y2 = topLeft ? y : this.height - y;
    const targetZWorld = targetZ && targetZ * this.distanceScales.pixelsPerMeter[2];
    const coord = pixelsToWorld([x, y2, z], this.pixelUnprojectionMatrix, targetZWorld);
    const [X, Y, Z] = this.unprojectPosition(coord);

    if (Number.isFinite(z)) {
      return [X, Y, Z];
    }

    return Number.isFinite(targetZ) ? [X, Y, targetZ] : [X, Y];
  }

  projectPosition(xyz) {
    const [X, Y] = this.projectFlat(xyz);
    const Z = (xyz[2] || 0) * this.distanceScales.pixelsPerMeter[2];
    return [X, Y, Z];
  }

  unprojectPosition(xyz) {
    const [X, Y] = this.unprojectFlat(xyz);
    const Z = (xyz[2] || 0) * this.distanceScales.metersPerPixel[2];
    return [X, Y, Z];
  }

  projectFlat(xyz) {
    let scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

    if (this.isGeospatial) {
      return lngLatToWorld(xyz, scale);
    }

    const {
      pixelsPerMeter
    } = this.distanceScales;
    return [xyz[0] * pixelsPerMeter[0], xyz[1] * pixelsPerMeter[1]];
  }

  unprojectFlat(xyz) {
    let scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

    if (this.isGeospatial) {
      return worldToLngLat(xyz, scale);
    }

    const {
      metersPerPixel
    } = this.distanceScales;
    return [xyz[0] * metersPerPixel[0], xyz[1] * metersPerPixel[1]];
  }

  getDistanceScales() {
    let coordinateOrigin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    if (coordinateOrigin) {
      return getDistanceScales({
        longitude: coordinateOrigin[0],
        latitude: coordinateOrigin[1],
        scale: this.scale,
        highPrecision: true
      });
    }

    return this.distanceScales;
  }

  getMatrices() {
    let {
      modelMatrix = null
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let modelViewProjectionMatrix = this.viewProjectionMatrix;
    let pixelProjectionMatrix = this.pixelProjectionMatrix;
    let pixelUnprojectionMatrix = this.pixelUnprojectionMatrix;

    if (modelMatrix) {
      modelViewProjectionMatrix = mat4.multiply([], this.viewProjectionMatrix, modelMatrix);
      pixelProjectionMatrix = mat4.multiply([], this.pixelProjectionMatrix, modelMatrix);
      pixelUnprojectionMatrix = mat4.invert([], pixelProjectionMatrix);
    }

    const matrices = Object.assign({
      modelViewProjectionMatrix,
      viewProjectionMatrix: this.viewProjectionMatrix,
      viewMatrix: this.viewMatrix,
      projectionMatrix: this.projectionMatrix,
      pixelProjectionMatrix,
      pixelUnprojectionMatrix,
      width: this.width,
      height: this.height,
      scale: this.scale
    });
    return matrices;
  }

  containsPixel(_ref) {
    let {
      x,
      y,
      width = 1,
      height = 1
    } = _ref;
    return x < this.x + this.width && this.x < x + width && y < this.y + this.height && this.y < y + height;
  }

  getCameraPosition() {
    return this.cameraPosition;
  }

  getCameraDirection() {
    return this.cameraDirection;
  }

  getCameraUp() {
    return this.cameraUp;
  }

  _addMetersToLngLat(lngLatZ, xyz) {
    const [lng, lat, Z = 0] = lngLatZ;

    const [deltaLng, deltaLat, deltaZ = 0] = this._metersToLngLatDelta(xyz);

    return lngLatZ.length === 2 ? [lng + deltaLng, lat + deltaLat] : [lng + deltaLng, lat + deltaLat, Z + deltaZ];
  }

  _metersToLngLatDelta(xyz) {
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

  _createProjectionMatrix(_ref2) {
    let {
      orthographic,
      fovyRadians,
      aspect,
      focalDistance,
      near,
      far
    } = _ref2;
    assert(Number.isFinite(fovyRadians));
    return orthographic ? new Matrix4().orthographic({
      fovy: fovyRadians,
      aspect,
      focalDistance,
      near,
      far
    }) : new Matrix4().perspective({
      fovy: fovyRadians,
      aspect,
      near,
      far
    });
  }

  _initViewMatrix(opts) {
    const {
      viewMatrix = IDENTITY,
      longitude = null,
      latitude = null,
      zoom = null,
      position = null,
      modelMatrix = null,
      focalDistance = 1,
      distanceScales = null
    } = opts;
    this.isGeospatial = Number.isFinite(latitude) && Number.isFinite(longitude);
    this.zoom = zoom;

    if (!Number.isFinite(this.zoom)) {
      this.zoom = this.isGeospatial ? getMeterZoom({
        latitude
      }) + Math.log2(focalDistance) : DEFAULT_ZOOM;
    }

    const scale = Math.pow(2, this.zoom);
    this.scale = scale;
    this.distanceScales = this.isGeospatial ? getDistanceScales({
      latitude,
      longitude,
      scale: this.scale
    }) : distanceScales || {
      pixelsPerMeter: [scale, scale, scale],
      metersPerPixel: [1 / scale, 1 / scale, 1 / scale]
    };
    this.focalDistance = focalDistance;
    this.distanceScales.metersPerPixel = new Vector3(this.distanceScales.metersPerPixel);
    this.distanceScales.pixelsPerMeter = new Vector3(this.distanceScales.pixelsPerMeter);
    this.position = ZERO_VECTOR;
    this.meterOffset = ZERO_VECTOR;

    if (position) {
      this.position = position;
      this.modelMatrix = modelMatrix;
      this.meterOffset = modelMatrix ? modelMatrix.transformVector(position) : position;
    }

    if (this.isGeospatial) {
      this.longitude = longitude;
      this.latitude = latitude;
      this.center = this._getCenterInWorld({
        longitude,
        latitude
      });
      this.viewMatrixUncentered = mat4.scale([], viewMatrix, [1, -1, 1]);
    } else {
      this.center = position ? this.projectPosition(position) : [0, 0, 0];
      this.viewMatrixUncentered = viewMatrix;
    }

    this.viewMatrix = new Matrix4().multiplyRight(this.viewMatrixUncentered).translate(new Vector3(this.center || ZERO_VECTOR).negate());
  }

  _getCenterInWorld(_ref3) {
    let {
      longitude,
      latitude
    } = _ref3;
    const {
      meterOffset,
      scale,
      distanceScales
    } = this;
    const center2d = this.projectFlat([longitude, latitude], scale);
    const center = new Vector3(center2d[0], center2d[1], 0);

    if (meterOffset) {
      const pixelPosition = new Vector3(meterOffset).scale(distanceScales.pixelsPerMeter);
      center.add(pixelPosition);
    }

    return center;
  }

  _initProjectionMatrix(opts) {
    const {
      projectionMatrix = null,
      orthographic = false,
      fovyRadians,
      fovyDegrees,
      fovy,
      near = 0.1,
      far = 1000,
      focalDistance = 1,
      orthographicFocalDistance
    } = opts;
    const radians = fovyRadians || (fovyDegrees || fovy || 75) * DEGREES_TO_RADIANS;
    this.projectionMatrix = projectionMatrix || this._createProjectionMatrix({
      orthographic,
      fovyRadians: radians,
      aspect: this.width / this.height,
      focalDistance: orthographicFocalDistance || focalDistance,
      near,
      far
    });
  }

  _initPixelMatrices() {
    const vpm = createMat4();
    mat4.multiply(vpm, vpm, this.projectionMatrix);
    mat4.multiply(vpm, vpm, this.viewMatrix);
    this.viewProjectionMatrix = vpm;
    this.viewMatrixInverse = mat4.invert([], this.viewMatrix) || this.viewMatrix;
    const {
      eye,
      direction,
      up
    } = extractCameraVectors({
      viewMatrix: this.viewMatrix,
      viewMatrixInverse: this.viewMatrixInverse
    });
    this.cameraPosition = eye;
    this.cameraDirection = direction;
    this.cameraUp = up;
    const viewportMatrix = createMat4();
    const pixelProjectionMatrix = createMat4();
    mat4.scale(viewportMatrix, viewportMatrix, [this.width / 2, -this.height / 2, 1]);
    mat4.translate(viewportMatrix, viewportMatrix, [1, -1, 0]);
    mat4.multiply(pixelProjectionMatrix, viewportMatrix, this.viewProjectionMatrix);
    this.pixelProjectionMatrix = pixelProjectionMatrix;
    this.viewportMatrix = viewportMatrix;
    this.pixelUnprojectionMatrix = mat4.invert(createMat4(), this.pixelProjectionMatrix);

    if (!this.pixelUnprojectionMatrix) {
      log.warn('Pixel project matrix not invertible')();
    }
  }

}
Viewport.displayName = 'Viewport';
//# sourceMappingURL=viewport.js.map