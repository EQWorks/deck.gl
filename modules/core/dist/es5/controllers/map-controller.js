"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testExports = exports.default = exports.MAPBOX_LIMITS = void 0;

var _math = require("math.gl");

var _controller = _interopRequireDefault(require("./controller"));

var _viewState = _interopRequireDefault(require("./view-state"));

var _viewportMercatorProject = _interopRequireWildcard(require("viewport-mercator-project"));

var _assert = _interopRequireDefault(require("../utils/assert"));

var _linearInterpolator = _interopRequireDefault(require("../transitions/linear-interpolator"));

var _transitionManager = require("./transition-manager");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const PITCH_MOUSE_THRESHOLD = 5;
const PITCH_ACCEL = 1.2;
const LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: t => t,
  transitionInterpolator: new _linearInterpolator.default(),
  transitionInterruption: _transitionManager.TRANSITION_EVENTS.BREAK
};
const NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
const MAPBOX_LIMITS = {
  minZoom: 0,
  maxZoom: 20,
  minPitch: 0,
  maxPitch: 60
};
exports.MAPBOX_LIMITS = MAPBOX_LIMITS;
const DEFAULT_STATE = {
  pitch: 0,
  bearing: 0,
  altitude: 1.5
};

class MapState extends _viewState.default {
  constructor() {
    let {
      width,
      height,
      latitude,
      longitude,
      zoom,
      bearing = DEFAULT_STATE.bearing,
      pitch = DEFAULT_STATE.pitch,
      altitude = DEFAULT_STATE.altitude,
      maxZoom = MAPBOX_LIMITS.maxZoom,
      minZoom = MAPBOX_LIMITS.minZoom,
      maxPitch = MAPBOX_LIMITS.maxPitch,
      minPitch = MAPBOX_LIMITS.minPitch,
      startPanLngLat,
      startZoomLngLat,
      startBearing,
      startPitch,
      startZoom
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _assert.default)(Number.isFinite(longitude), '`longitude` must be supplied');
    (0, _assert.default)(Number.isFinite(latitude), '`latitude` must be supplied');
    (0, _assert.default)(Number.isFinite(zoom), '`zoom` must be supplied');
    super({
      width,
      height,
      latitude,
      longitude,
      zoom,
      bearing,
      pitch,
      altitude,
      maxZoom,
      minZoom,
      maxPitch,
      minPitch
    });
    this._interactiveState = {
      startPanLngLat,
      startZoomLngLat,
      startBearing,
      startPitch,
      startZoom
    };
  }

  getViewportProps() {
    return this._viewportProps;
  }

  getInteractiveState() {
    return this._interactiveState;
  }

  panStart(_ref) {
    let {
      pos
    } = _ref;
    return this._getUpdatedState({
      startPanLngLat: this._unproject(pos)
    });
  }

  pan(_ref2) {
    let {
      pos,
      startPos
    } = _ref2;

    const startPanLngLat = this._interactiveState.startPanLngLat || this._unproject(startPos);

    if (!startPanLngLat) {
      return this;
    }

    const [longitude, latitude] = this._calculateNewLngLat({
      startPanLngLat,
      pos
    });

    return this._getUpdatedState({
      longitude,
      latitude
    });
  }

  panEnd() {
    return this._getUpdatedState({
      startPanLngLat: null
    });
  }

  rotateStart(_ref3) {
    let {
      pos
    } = _ref3;
    return this._getUpdatedState({
      startBearing: this._viewportProps.bearing,
      startPitch: this._viewportProps.pitch
    });
  }

  rotate(_ref4) {
    let {
      deltaScaleX = 0,
      deltaScaleY = 0
    } = _ref4;
    const {
      startBearing,
      startPitch
    } = this._interactiveState;

    if (!Number.isFinite(startBearing) || !Number.isFinite(startPitch)) {
      return this;
    }

    const {
      pitch,
      bearing
    } = this._calculateNewPitchAndBearing({
      deltaScaleX,
      deltaScaleY,
      startBearing,
      startPitch
    });

    return this._getUpdatedState({
      bearing,
      pitch
    });
  }

  rotateEnd() {
    return this._getUpdatedState({
      startBearing: null,
      startPitch: null
    });
  }

  zoomStart(_ref5) {
    let {
      pos
    } = _ref5;
    return this._getUpdatedState({
      startZoomLngLat: this._unproject(pos),
      startZoom: this._viewportProps.zoom
    });
  }

  zoom(_ref6) {
    let {
      pos,
      startPos,
      scale
    } = _ref6;
    (0, _assert.default)(scale > 0, '`scale` must be a positive number');
    let {
      startZoom,
      startZoomLngLat
    } = this._interactiveState;

    if (!Number.isFinite(startZoom)) {
      startZoom = this._viewportProps.zoom;
      startZoomLngLat = this._unproject(startPos) || this._unproject(pos);
    }

    (0, _assert.default)(startZoomLngLat, '`startZoomLngLat` prop is required ' + 'for zoom behavior to calculate where to position the map.');

    const zoom = this._calculateNewZoom({
      scale,
      startZoom
    });

    const zoomedViewport = new _viewportMercatorProject.default(Object.assign({}, this._viewportProps, {
      zoom
    }));
    const [longitude, latitude] = zoomedViewport.getLocationAtPoint({
      lngLat: startZoomLngLat,
      pos
    });
    return this._getUpdatedState({
      zoom,
      longitude,
      latitude
    });
  }

  zoomEnd() {
    return this._getUpdatedState({
      startZoomLngLat: null,
      startZoom: null
    });
  }

  zoomIn() {
    return this._zoomFromCenter(2);
  }

  zoomOut() {
    return this._zoomFromCenter(0.5);
  }

  moveLeft() {
    return this._panFromCenter([100, 0]);
  }

  moveRight() {
    return this._panFromCenter([-100, 0]);
  }

  moveUp() {
    return this._panFromCenter([0, 100]);
  }

  moveDown() {
    return this._panFromCenter([0, -100]);
  }

  rotateLeft() {
    return this._getUpdatedState({
      bearing: this._viewportProps.bearing - 15
    });
  }

  rotateRight() {
    return this._getUpdatedState({
      bearing: this._viewportProps.bearing + 15
    });
  }

  rotateUp() {
    return this._getUpdatedState({
      pitch: this._viewportProps.pitch + 10
    });
  }

  rotateDown() {
    return this._getUpdatedState({
      pitch: this._viewportProps.pitch - 10
    });
  }

  shortestPathFrom(viewState) {
    const fromProps = viewState.getViewportProps();
    const props = Object.assign({}, this._viewportProps);
    const {
      bearing,
      longitude
    } = props;

    if (Math.abs(bearing - fromProps.bearing) > 180) {
      props.bearing = bearing < 0 ? bearing + 360 : bearing - 360;
    }

    if (Math.abs(longitude - fromProps.longitude) > 180) {
      props.longitude = longitude < 0 ? longitude + 360 : longitude - 360;
    }

    return props;
  }

  _zoomFromCenter(scale) {
    const {
      width,
      height
    } = this._viewportProps;
    return this.zoom({
      pos: [width / 2, height / 2],
      scale
    });
  }

  _panFromCenter(offset) {
    const {
      width,
      height
    } = this._viewportProps;
    return this.pan({
      startPos: [width / 2, height / 2],
      pos: [width / 2 + offset[0], height / 2 + offset[1]]
    });
  }

  _getUpdatedState(newProps) {
    return new MapState(Object.assign({}, this._viewportProps, this._interactiveState, newProps));
  }

  _applyConstraints(props) {
    const {
      maxZoom,
      minZoom,
      zoom
    } = props;
    props.zoom = (0, _math.clamp)(zoom, minZoom, maxZoom);
    const {
      maxPitch,
      minPitch,
      pitch
    } = props;
    props.pitch = (0, _math.clamp)(pitch, minPitch, maxPitch);
    Object.assign(props, (0, _viewportMercatorProject.normalizeViewportProps)(props));
    return props;
  }

  _unproject(pos) {
    const viewport = new _viewportMercatorProject.default(this._viewportProps);
    return pos && viewport.unproject(pos);
  }

  _calculateNewLngLat(_ref7) {
    let {
      startPanLngLat,
      pos
    } = _ref7;
    const viewport = new _viewportMercatorProject.default(this._viewportProps);
    return viewport.getMapCenterByLngLatPosition({
      lngLat: startPanLngLat,
      pos
    });
  }

  _calculateNewZoom(_ref8) {
    let {
      scale,
      startZoom
    } = _ref8;
    const {
      maxZoom,
      minZoom
    } = this._viewportProps;
    const zoom = startZoom + Math.log2(scale);
    return (0, _math.clamp)(zoom, minZoom, maxZoom);
  }

  _calculateNewPitchAndBearing(_ref9) {
    let {
      deltaScaleX,
      deltaScaleY,
      startBearing,
      startPitch
    } = _ref9;
    deltaScaleY = (0, _math.clamp)(deltaScaleY, -1, 1);
    const {
      minPitch,
      maxPitch
    } = this._viewportProps;
    const bearing = startBearing + 180 * deltaScaleX;
    let pitch = startPitch;

    if (deltaScaleY > 0) {
      pitch = startPitch + deltaScaleY * (maxPitch - startPitch);
    } else if (deltaScaleY < 0) {
      pitch = startPitch - deltaScaleY * (minPitch - startPitch);
    }

    return {
      pitch,
      bearing
    };
  }

}

class MapController extends _controller.default {
  constructor(props) {
    super(MapState, props);
    this.invertPan = true;
  }

  _getTransitionProps() {
    return LINEAR_TRANSITION_PROPS;
  }

  _onPanRotate(event) {
    if (!this.dragRotate) {
      return false;
    }

    const {
      deltaX,
      deltaY
    } = event;
    const [, centerY] = this.getCenter(event);
    const startY = centerY - deltaY;
    const {
      width,
      height
    } = this.controllerState.getViewportProps();
    const deltaScaleX = deltaX / width;
    let deltaScaleY = 0;

    if (deltaY > 0) {
      if (Math.abs(height - startY) > PITCH_MOUSE_THRESHOLD) {
        deltaScaleY = deltaY / (startY - height) * PITCH_ACCEL;
      }
    } else if (deltaY < 0) {
      if (startY > PITCH_MOUSE_THRESHOLD) {
        deltaScaleY = 1 - centerY / startY;
      }
    }

    deltaScaleY = Math.min(1, Math.max(-1, deltaScaleY));
    const newControllerState = this.controllerState.rotate({
      deltaScaleX,
      deltaScaleY
    });
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

}

exports.default = MapController;
const testExports = {
  MapState
};
exports.testExports = testExports;
//# sourceMappingURL=map-controller.js.map