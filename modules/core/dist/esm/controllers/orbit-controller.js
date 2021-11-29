import { clamp, Vector2 } from 'math.gl';
import Controller from './controller';
import ViewState from './view-state';
import LinearInterpolator from '../transitions/linear-interpolator';
import { TRANSITION_EVENTS } from './transition-manager';
const MOVEMENT_SPEED = 50;
const DEFAULT_STATE = {
  orbitAxis: 'Z',
  rotationX: 0,
  rotationOrbit: 0,
  fovy: 50,
  zoom: 0,
  target: [0, 0, 0],
  minZoom: -Infinity,
  maxZoom: Infinity
};
const LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: t => t,
  transitionInterpolator: new LinearInterpolator(['target', 'zoom', 'rotationX', 'rotationOrbit']),
  transitionInterruption: TRANSITION_EVENTS.BREAK
};

const zoom2Scale = zoom => Math.pow(2, zoom);

export class OrbitState extends ViewState {
  constructor(_ref) {
    let {
      ViewportType,
      width,
      height,
      orbitAxis = DEFAULT_STATE.orbitAxis,
      rotationX = DEFAULT_STATE.rotationX,
      rotationOrbit = DEFAULT_STATE.rotationOrbit,
      target = DEFAULT_STATE.target,
      zoom = DEFAULT_STATE.zoom,
      fovy = DEFAULT_STATE.fovy,
      minZoom = DEFAULT_STATE.minZoom,
      maxZoom = DEFAULT_STATE.maxZoom,
      startPanPosition,
      startTarget,
      startRotationX,
      startRotationOrbit,
      startZoomPosition,
      startZoom
    } = _ref;
    super({
      width,
      height,
      orbitAxis,
      rotationX,
      rotationOrbit,
      target,
      fovy,
      zoom,
      minZoom,
      maxZoom
    });
    this._interactiveState = {
      startPanPosition,
      startTarget,
      startRotationX,
      startRotationOrbit,
      startZoomPosition,
      startZoom
    };
    this.ViewportType = ViewportType;
  }

  getViewportProps() {
    return this._viewportProps;
  }

  getInteractiveState() {
    return this._interactiveState;
  }

  panStart(_ref2) {
    let {
      pos
    } = _ref2;
    const {
      target
    } = this._viewportProps;
    return this._getUpdatedState({
      startPanPosition: pos,
      startTarget: target
    });
  }

  pan(_ref3) {
    let {
      pos,
      startPos
    } = _ref3;
    const {
      startPanPosition,
      startTarget
    } = this._interactiveState;
    const delta = new Vector2(pos).subtract(startPanPosition);
    return this._getUpdatedState({
      target: this._calculateNewTarget({
        startTarget,
        pixelOffset: delta
      })
    });
  }

  panEnd() {
    return this._getUpdatedState({
      startPanPosition: null,
      startTarget: null
    });
  }

  rotateStart(_ref4) {
    let {
      pos
    } = _ref4;
    return this._getUpdatedState({
      startRotationX: this._viewportProps.rotationX,
      startRotationOrbit: this._viewportProps.rotationOrbit
    });
  }

  rotate(_ref5) {
    let {
      deltaScaleX,
      deltaScaleY
    } = _ref5;
    const {
      startRotationX,
      startRotationOrbit
    } = this._interactiveState;

    if (!Number.isFinite(startRotationX) || !Number.isFinite(startRotationOrbit)) {
      return this;
    }

    const newRotationX = clamp(startRotationX + deltaScaleY * 180, -89.999, 89.999);
    const newRotationOrbit = (startRotationOrbit + deltaScaleX * 180) % 360;
    return this._getUpdatedState({
      rotationX: newRotationX,
      rotationOrbit: newRotationOrbit,
      isRotating: true
    });
  }

  rotateEnd() {
    return this._getUpdatedState({
      startRotationX: null,
      startRotationOrbit: null
    });
  }

  shortestPathFrom(viewState) {
    const props = Object.assign({}, this._viewportProps);
    return props;
  }

  zoomStart(_ref6) {
    let {
      pos
    } = _ref6;
    return this._getUpdatedState({
      startZoomPosition: pos,
      startTarget: this._viewportProps.target,
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
      width,
      height,
      target
    } = this._viewportProps;
    let {
      startZoom,
      startZoomPosition,
      startTarget
    } = this._interactiveState;

    if (!Number.isFinite(startZoom)) {
      startZoom = zoom;
      startTarget = target;
      startZoomPosition = startPos || pos;
    }

    const newZoom = this._calculateNewZoom({
      scale,
      startZoom
    });

    const startScale = zoom2Scale(startZoom);
    const newScale = zoom2Scale(newZoom);
    const dX = (width / 2 - startZoomPosition[0]) * (newScale / startScale - 1);
    const dY = (height / 2 - startZoomPosition[1]) * (newScale / startScale - 1);
    return this._getUpdatedState({
      zoom: newZoom,
      target: this._calculateNewTarget({
        startTarget,
        zoom: newZoom,
        pixelOffset: [dX, dY]
      })
    });
  }

  zoomEnd() {
    return this._getUpdatedState({
      startZoomPosition: null,
      startTarget: null,
      startZoom: null
    });
  }

  zoomIn() {
    return this._getUpdatedState({
      zoom: this._calculateNewZoom({
        scale: 2
      })
    });
  }

  zoomOut() {
    return this._getUpdatedState({
      zoom: this._calculateNewZoom({
        scale: 0.5
      })
    });
  }

  moveLeft() {
    const pixelOffset = [-MOVEMENT_SPEED, 0];
    return this._getUpdatedState({
      target: this._calculateNewTarget({
        pixelOffset
      })
    });
  }

  moveRight() {
    const pixelOffset = [MOVEMENT_SPEED, 0];
    return this._getUpdatedState({
      target: this._calculateNewTarget({
        pixelOffset
      })
    });
  }

  moveUp() {
    const pixelOffset = [0, -MOVEMENT_SPEED];
    return this._getUpdatedState({
      target: this._calculateNewTarget({
        pixelOffset
      })
    });
  }

  moveDown() {
    const pixelOffset = [0, MOVEMENT_SPEED];
    return this._getUpdatedState({
      target: this._calculateNewTarget({
        pixelOffset
      })
    });
  }

  rotateLeft() {
    return this._getUpdatedState({
      rotationOrbit: this._viewportProps.rotationOrbit - 15
    });
  }

  rotateRight() {
    return this._getUpdatedState({
      rotationOrbit: this._viewportProps.rotationOrbit + 15
    });
  }

  rotateUp() {
    return this._getUpdatedState({
      rotationX: this._viewportProps.rotationX - 10
    });
  }

  rotateDown() {
    return this._getUpdatedState({
      rotationX: this._viewportProps.rotationX + 10
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

    if (!Number.isFinite(startZoom)) {
      startZoom = this._viewportProps.zoom;
    }

    const zoom = startZoom + Math.log2(scale);
    return clamp(zoom, minZoom, maxZoom);
  }

  _calculateNewTarget(_ref9) {
    let {
      startTarget,
      zoom,
      pixelOffset
    } = _ref9;
    const viewportProps = Object.assign({}, this._viewportProps);

    if (Number.isFinite(zoom)) {
      viewportProps.zoom = zoom;
    }

    if (startTarget) {
      viewportProps.target = startTarget;
    }

    const viewport = new this.ViewportType(viewportProps);
    const center = viewport.project(viewportProps.target);
    return viewport.unproject([center[0] - pixelOffset[0], center[1] - pixelOffset[1], center[2]]);
  }

  _getUpdatedState(newProps) {
    return new OrbitState(Object.assign({}, this._viewportProps, this._interactiveState, newProps));
  }

  _applyConstraints(props) {
    const {
      maxZoom,
      minZoom,
      zoom
    } = props;
    props.zoom = zoom > maxZoom ? maxZoom : zoom;
    props.zoom = zoom < minZoom ? minZoom : zoom;
    return props;
  }

}
export default class OrbitController extends Controller {
  constructor(props) {
    super(OrbitState, props);
  }

  _getTransitionProps() {
    return LINEAR_TRANSITION_PROPS;
  }

}
//# sourceMappingURL=orbit-controller.js.map