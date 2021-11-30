"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _transitionManager = _interopRequireDefault(require("./transition-manager"));

var _log = _interopRequireDefault(require("../utils/log"));

var _assert = _interopRequireDefault(require("../utils/assert"));

const NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
const ZOOM_ACCEL = 0.01;
const EVENT_TYPES = {
  WHEEL: ['wheel'],
  PAN: ['panstart', 'panmove', 'panend'],
  PINCH: ['pinchstart', 'pinchmove', 'pinchend'],
  DOUBLE_TAP: ['doubletap'],
  KEYBOARD: ['keydown']
};

class Controller {
  constructor(ControllerState) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _assert.default)(ControllerState);
    this.ControllerState = ControllerState;
    this.controllerState = null;
    this.controllerStateProps = null;
    this.eventManager = null;
    this.transitionManager = new _transitionManager.default(ControllerState, options);
    this._events = null;
    this._state = {
      isDragging: false
    };
    this.events = [];
    this.onViewStateChange = null;
    this.onStateChange = null;
    this.invertPan = false;
    this.handleEvent = this.handleEvent.bind(this);
    this.setProps(options);
  }

  finalize() {
    for (const eventName in this._events) {
      if (this._events[eventName]) {
        this.eventManager.off(eventName, this.handleEvent);
      }
    }

    this.transitionManager.finalize();
  }

  handleEvent(event) {
    const {
      ControllerState
    } = this;
    this.controllerState = new ControllerState(Object.assign({}, this.controllerStateProps, this._state));

    switch (event.type) {
      case 'panstart':
        return this._onPanStart(event);

      case 'panmove':
        return this._onPan(event);

      case 'panend':
        return this._onPanEnd(event);

      case 'pinchstart':
        return this._onPinchStart(event);

      case 'pinchmove':
        return this._onPinch(event);

      case 'pinchend':
        return this._onPinchEnd(event);

      case 'doubletap':
        return this._onDoubleTap(event);

      case 'wheel':
        return this._onWheel(event);

      case 'keydown':
        return this._onKeyDown(event);

      default:
        return false;
    }
  }

  getCenter(event) {
    const {
      x,
      y
    } = this.controllerStateProps;
    const {
      offsetCenter
    } = event;
    return [offsetCenter.x - x, offsetCenter.y - y];
  }

  isPointInBounds(pos) {
    const {
      width,
      height
    } = this.controllerStateProps;
    return pos[0] >= 0 && pos[0] <= width && pos[1] >= 0 && pos[1] <= height;
  }

  isFunctionKeyPressed(event) {
    const {
      srcEvent
    } = event;
    return Boolean(srcEvent.metaKey || srcEvent.altKey || srcEvent.ctrlKey || srcEvent.shiftKey);
  }

  isDragging() {
    return this._state.isDragging;
  }

  setProps(props) {
    if ('onViewportChange' in props) {
      _log.default.removed('onViewportChange')();
    }

    if ('onViewStateChange' in props) {
      this.onViewStateChange = props.onViewStateChange;
    }

    if ('onStateChange' in props) {
      this.onStateChange = props.onStateChange;
    }

    this.controllerStateProps = props;

    if ('eventManager' in props && this.eventManager !== props.eventManager) {
      this.eventManager = props.eventManager;
      this._events = {};
      this.toggleEvents(this.events, true);
    }

    this.transitionManager.processViewStateChange(this.controllerStateProps);
    const {
      scrollZoom = true,
      dragPan = true,
      dragRotate = true,
      doubleClickZoom = true,
      touchZoom = true,
      touchRotate = false,
      keyboard = true
    } = props;
    const isInteractive = Boolean(this.onViewStateChange);
    this.toggleEvents(EVENT_TYPES.WHEEL, isInteractive && scrollZoom);
    this.toggleEvents(EVENT_TYPES.PAN, isInteractive && (dragPan || dragRotate));
    this.toggleEvents(EVENT_TYPES.PINCH, isInteractive && (touchZoom || touchRotate));
    this.toggleEvents(EVENT_TYPES.DOUBLE_TAP, isInteractive && doubleClickZoom);
    this.toggleEvents(EVENT_TYPES.KEYBOARD, isInteractive && keyboard);
    this.scrollZoom = scrollZoom;
    this.dragPan = dragPan;
    this.dragRotate = dragRotate;
    this.doubleClickZoom = doubleClickZoom;
    this.touchZoom = touchZoom;
    this.touchRotate = touchRotate;
    this.keyboard = keyboard;
  }

  updateTransition(timestamp) {
    this.transitionManager.updateTransition(timestamp);
  }

  toggleEvents(eventNames, enabled) {
    if (this.eventManager) {
      eventNames.forEach(eventName => {
        if (this._events[eventName] !== enabled) {
          this._events[eventName] = enabled;

          if (enabled) {
            this.eventManager.on(eventName, this.handleEvent);
          } else {
            this.eventManager.off(eventName, this.handleEvent);
          }
        }
      });
    }
  }

  setOptions(props) {
    return this.setProps(props);
  }

  updateViewport(newControllerState) {
    let extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let interactionState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const viewState = Object.assign({}, newControllerState.getViewportProps(), extraProps);
    const changed = this.controllerState !== newControllerState;

    if (changed) {
      const oldViewState = this.controllerState ? this.controllerState.getViewportProps() : null;

      if (this.onViewStateChange) {
        this.onViewStateChange({
          viewState,
          interactionState,
          oldViewState
        });
      }
    }

    Object.assign(this._state, Object.assign({}, newControllerState.getInteractiveState(), interactionState));

    if (this.onStateChange) {
      this.onStateChange(this._state);
    }
  }

  _onPanStart(event) {
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos)) {
      return false;
    }

    const newControllerState = this.controllerState.panStart({
      pos
    }).rotateStart({
      pos
    });
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

  _onPan(event) {
    let alternateMode = this.isFunctionKeyPressed(event) || event.rightButton;
    alternateMode = this.invertPan ? !alternateMode : alternateMode;
    return alternateMode ? this._onPanMove(event) : this._onPanRotate(event);
  }

  _onPanEnd(event) {
    const newControllerState = this.controllerState.panEnd().rotateEnd();
    return this.updateViewport(newControllerState, null, {
      isDragging: false
    });
  }

  _onPanMove(event) {
    if (!this.dragPan) {
      return false;
    }

    const pos = this.getCenter(event);

    if (!this.isDragging()) {
      return false;
    }

    const newControllerState = this.controllerState.pan({
      pos
    });
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

  _onPanRotate(event) {
    if (!this.dragRotate) {
      return false;
    }

    const {
      deltaX,
      deltaY
    } = event;
    const {
      width,
      height
    } = this.controllerState.getViewportProps();
    const deltaScaleX = deltaX / width;
    const deltaScaleY = deltaY / height;
    const newControllerState = this.controllerState.rotate({
      deltaScaleX,
      deltaScaleY
    });
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

  _onWheel(event) {
    if (!this.scrollZoom) {
      return false;
    }

    event.preventDefault();
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos)) {
      return false;
    }

    const {
      delta
    } = event;
    let scale = 2 / (1 + Math.exp(-Math.abs(delta * ZOOM_ACCEL)));

    if (delta < 0 && scale !== 0) {
      scale = 1 / scale;
    }

    const newControllerState = this.controllerState.zoom({
      pos,
      scale
    });
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS);
  }

  _onPinchStart(event) {
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos)) {
      return false;
    }

    const newControllerState = this.controllerState.zoomStart({
      pos
    }).rotateStart({
      pos
    });
    this._state.startPinchRotation = event.rotation;
    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

  _onPinch(event) {
    if (!this.touchZoom && !this.touchRotate) {
      return false;
    }

    let newControllerState = this.controllerState;

    if (this.touchZoom) {
      const {
        scale
      } = event;
      const pos = this.getCenter(event);
      newControllerState = newControllerState.zoom({
        pos,
        scale
      });
    }

    if (this.touchRotate) {
      const {
        rotation
      } = event;
      const {
        startPinchRotation
      } = this._state;
      newControllerState = newControllerState.rotate({
        deltaScaleX: -(rotation - startPinchRotation) / 180
      });
    }

    return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
  }

  _onPinchEnd(event) {
    const newControllerState = this.controllerState.zoomEnd().rotateEnd();
    this._state.startPinchRotation = 0;
    return this.updateViewport(newControllerState, null, {
      isDragging: false
    });
  }

  _onDoubleTap(event) {
    if (!this.doubleClickZoom) {
      return false;
    }

    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos)) {
      return false;
    }

    const isZoomOut = this.isFunctionKeyPressed(event);
    const newControllerState = this.controllerState.zoom({
      pos,
      scale: isZoomOut ? 0.5 : 2
    });
    return this.updateViewport(newControllerState, this._getTransitionProps());
  }

  _onKeyDown(event) {
    if (!this.keyboard) {
      return false;
    }

    const funcKey = this.isFunctionKeyPressed(event);
    const {
      controllerState
    } = this;
    let newControllerState;

    switch (event.srcEvent.keyCode) {
      case 189:
        newControllerState = funcKey ? controllerState.zoomOut().zoomOut() : controllerState.zoomOut();
        break;

      case 187:
        newControllerState = funcKey ? controllerState.zoomIn().zoomIn() : controllerState.zoomIn();
        break;

      case 37:
        newControllerState = funcKey ? controllerState.rotateLeft() : controllerState.moveLeft();
        break;

      case 39:
        newControllerState = funcKey ? controllerState.rotateRight() : controllerState.moveRight();
        break;

      case 38:
        newControllerState = funcKey ? controllerState.rotateUp() : controllerState.moveUp();
        break;

      case 40:
        newControllerState = funcKey ? controllerState.rotateDown() : controllerState.moveDown();
        break;

      default:
        return false;
    }

    return this.updateViewport(newControllerState, this._getTransitionProps());
  }

  _getTransitionProps() {
    return NO_TRANSITION_PROPS;
  }

}

exports.default = Controller;
//# sourceMappingURL=controller.js.map