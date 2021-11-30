import Controller from './controller';
import ViewState from './view-state';
import { Vector3, clamp } from 'math.gl';
const MOVEMENT_SPEED = 1;
const ROTATION_STEP_DEGREES = 2;

function ensureFinite(value, fallbackValue) {
  return Number.isFinite(value) ? value : fallbackValue;
}

class FirstPersonState extends ViewState {
  constructor(_ref) {
    let {
      width,
      height,
      position,
      bearing,
      pitch,
      longitude,
      latitude,
      zoom,
      syncBearing = true,
      bounds,
      startPanEventPosition,
      startPanPosition,
      startRotateCenter,
      startRotateViewport,
      startZoomPos,
      startZoom
    } = _ref;
    super({
      width,
      height,
      position,
      bearing,
      pitch,
      longitude,
      latitude,
      zoom
    });
    this._interactiveState = {
      startPanEventPosition,
      startPanPosition,
      startRotateCenter,
      startRotateViewport,
      startZoomPos,
      startZoom
    };
  }

  getInteractiveState() {
    return this._interactiveState;
  }

  panStart(_ref2) {
    let {
      pos
    } = _ref2;
    const {
      translationX,
      translationY
    } = this._viewportProps;
    return this._getUpdatedState({
      startPanPosition: [translationX, translationY],
      startPanEventPosition: pos
    });
  }

  pan(_ref3) {
    let {
      pos,
      startPos
    } = _ref3;
    const startPanEventPosition = this._interactiveState.startPanEventPosition || startPos;

    if (!startPanEventPosition) {
      return this;
    }

    let [translationX, translationY] = this._interactiveState.startPanPosition || [];
    translationX = ensureFinite(translationX, this._viewportProps.translationX);
    translationY = ensureFinite(translationY, this._viewportProps.translationY);
    const deltaX = pos[0] - startPanEventPosition[0];
    const deltaY = pos[1] - startPanEventPosition[1];
    return this._getUpdatedState({
      translationX: translationX + deltaX,
      translationY: translationY - deltaY
    });
  }

  panEnd() {
    return this._getUpdatedState({
      startPanPosition: null,
      startPanPos: null
    });
  }

  rotateStart(_ref4) {
    let {
      pos
    } = _ref4;
    return this._getUpdatedState({
      startRotateCenter: this._viewportProps.position,
      startRotateViewport: this._viewportProps
    });
  }

  rotate(_ref5) {
    let {
      deltaScaleX,
      deltaScaleY
    } = _ref5;

    if (!this._interactiveState.startRotateCenter) {
      return this;
    }

    const {
      bearing,
      pitch
    } = this._viewportProps;
    return this._getUpdatedState({
      bearing: bearing + deltaScaleX * 10,
      pitch: pitch - deltaScaleY * 10
    });
  }

  rotateEnd() {
    return this._getUpdatedState({
      startRotateCenter: null,
      startRotateViewport: null
    });
  }

  zoomStart(_ref6) {
    let {
      pos
    } = _ref6;
    return this._getUpdatedState({
      startZoomPos: pos,
      startZoom: this._viewportProps.zoom
    });
  }

  zoom(_ref7) {
    let {
      pos,
      startPos,
      scale
    } = _ref7;
    const {
      zoom,
      minZoom,
      maxZoom,
      width,
      height,
      translationX,
      translationY
    } = this._viewportProps;
    const startZoomPos = this._interactiveState.startZoomPos || startPos || pos;
    const newZoom = clamp(zoom * scale, minZoom, maxZoom);
    const deltaX = pos[0] - startZoomPos[0];
    const deltaY = pos[1] - startZoomPos[1];
    const cx = startZoomPos[0] - width / 2;
    const cy = height / 2 - startZoomPos[1];
    const newTranslationX = cx - (cx - translationX) * newZoom / zoom + deltaX;
    const newTranslationY = cy - (cy - translationY) * newZoom / zoom - deltaY;
    return newZoom / zoom < 1 ? this.moveBackward() : this.moveForward();
  }

  zoomEnd() {
    return this._getUpdatedState({
      startZoomPos: null,
      startZoom: null
    });
  }

  moveLeft() {
    const {
      bearing
    } = this._viewportProps;
    const newBearing = bearing - ROTATION_STEP_DEGREES;
    return this._getUpdatedState({
      bearing: newBearing
    });
  }

  moveRight() {
    const {
      bearing
    } = this._viewportProps;
    const newBearing = bearing + ROTATION_STEP_DEGREES;
    return this._getUpdatedState({
      bearing: newBearing
    });
  }

  moveForward() {
    const {
      position
    } = this._viewportProps;
    const direction = this.getDirection();
    const delta = new Vector3(direction).normalize().scale(MOVEMENT_SPEED);
    return this._getUpdatedState({
      position: new Vector3(position).add(delta)
    });
  }

  moveBackward() {
    const {
      position
    } = this._viewportProps;
    const direction = this.getDirection();
    const delta = new Vector3(direction).normalize().scale(-MOVEMENT_SPEED);
    return this._getUpdatedState({
      position: new Vector3(position).add(delta)
    });
  }

  moveUp() {
    const {
      position
    } = this._viewportProps;
    const delta = [0, 0, 1];
    return this._getUpdatedState({
      position: new Vector3(position).add(delta)
    });
  }

  moveDown() {
    const {
      position
    } = this._viewportProps;
    const delta = position[2] >= 1 ? [0, 0, -1] : [0, 0, 0];
    return this._getUpdatedState({
      position: new Vector3(position).add(delta)
    });
  }

  zoomIn() {
    return this._getUpdatedState({
      zoom: this._viewportProps.zoom + 0.2
    });
  }

  zoomOut() {
    return this._getUpdatedState({
      zoom: this._viewportProps.zoom - 0.2
    });
  }

  _getUpdatedState(newProps) {
    return new FirstPersonState(Object.assign({}, this._viewportProps, this._interactiveState, newProps));
  }

}

export default class FirstPersonController extends Controller {
  constructor(props) {
    super(FirstPersonState, props);
  }

}
//# sourceMappingURL=first-person-controller.js.map