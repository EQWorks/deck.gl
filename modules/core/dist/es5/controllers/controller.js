"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _transitionManager = _interopRequireDefault(require("./transition-manager"));

var _log = _interopRequireDefault(require("../utils/log"));

var _assert = _interopRequireDefault(require("../utils/assert"));

var NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
var ZOOM_ACCEL = 0.01;
var EVENT_TYPES = {
  WHEEL: ['wheel'],
  PAN: ['panstart', 'panmove', 'panend'],
  PINCH: ['pinchstart', 'pinchmove', 'pinchend'],
  DOUBLE_TAP: ['doubletap'],
  KEYBOARD: ['keydown']
};

var Controller = function () {
  function Controller(ControllerState) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2.default)(this, Controller);
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

  (0, _createClass2.default)(Controller, [{
    key: "finalize",
    value: function finalize() {
      for (var eventName in this._events) {
        if (this._events[eventName]) {
          this.eventManager.off(eventName, this.handleEvent);
        }
      }

      this.transitionManager.finalize();
    }
  }, {
    key: "handleEvent",
    value: function handleEvent(event) {
      var ControllerState = this.ControllerState;
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
  }, {
    key: "getCenter",
    value: function getCenter(event) {
      var _this$controllerState = this.controllerStateProps,
          x = _this$controllerState.x,
          y = _this$controllerState.y;
      var offsetCenter = event.offsetCenter;
      return [offsetCenter.x - x, offsetCenter.y - y];
    }
  }, {
    key: "isPointInBounds",
    value: function isPointInBounds(pos) {
      var _this$controllerState2 = this.controllerStateProps,
          width = _this$controllerState2.width,
          height = _this$controllerState2.height;
      return pos[0] >= 0 && pos[0] <= width && pos[1] >= 0 && pos[1] <= height;
    }
  }, {
    key: "isFunctionKeyPressed",
    value: function isFunctionKeyPressed(event) {
      var srcEvent = event.srcEvent;
      return Boolean(srcEvent.metaKey || srcEvent.altKey || srcEvent.ctrlKey || srcEvent.shiftKey);
    }
  }, {
    key: "isDragging",
    value: function isDragging() {
      return this._state.isDragging;
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
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
      var _props$scrollZoom = props.scrollZoom,
          scrollZoom = _props$scrollZoom === void 0 ? true : _props$scrollZoom,
          _props$dragPan = props.dragPan,
          dragPan = _props$dragPan === void 0 ? true : _props$dragPan,
          _props$dragRotate = props.dragRotate,
          dragRotate = _props$dragRotate === void 0 ? true : _props$dragRotate,
          _props$doubleClickZoo = props.doubleClickZoom,
          doubleClickZoom = _props$doubleClickZoo === void 0 ? true : _props$doubleClickZoo,
          _props$touchZoom = props.touchZoom,
          touchZoom = _props$touchZoom === void 0 ? true : _props$touchZoom,
          _props$touchRotate = props.touchRotate,
          touchRotate = _props$touchRotate === void 0 ? false : _props$touchRotate,
          _props$keyboard = props.keyboard,
          keyboard = _props$keyboard === void 0 ? true : _props$keyboard;
      var isInteractive = Boolean(this.onViewStateChange);
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
  }, {
    key: "updateTransition",
    value: function updateTransition(timestamp) {
      this.transitionManager.updateTransition(timestamp);
    }
  }, {
    key: "toggleEvents",
    value: function toggleEvents(eventNames, enabled) {
      var _this = this;

      if (this.eventManager) {
        eventNames.forEach(function (eventName) {
          if (_this._events[eventName] !== enabled) {
            _this._events[eventName] = enabled;

            if (enabled) {
              _this.eventManager.on(eventName, _this.handleEvent);
            } else {
              _this.eventManager.off(eventName, _this.handleEvent);
            }
          }
        });
      }
    }
  }, {
    key: "setOptions",
    value: function setOptions(props) {
      return this.setProps(props);
    }
  }, {
    key: "updateViewport",
    value: function updateViewport(newControllerState) {
      var extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var interactionState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var viewState = Object.assign({}, newControllerState.getViewportProps(), extraProps);
      var changed = this.controllerState !== newControllerState;

      if (changed) {
        var oldViewState = this.controllerState ? this.controllerState.getViewportProps() : null;

        if (this.onViewStateChange) {
          this.onViewStateChange({
            viewState: viewState,
            interactionState: interactionState,
            oldViewState: oldViewState
          });
        }
      }

      Object.assign(this._state, Object.assign({}, newControllerState.getInteractiveState(), interactionState));

      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
    }
  }, {
    key: "_onPanStart",
    value: function _onPanStart(event) {
      var pos = this.getCenter(event);

      if (!this.isPointInBounds(pos)) {
        return false;
      }

      var newControllerState = this.controllerState.panStart({
        pos: pos
      }).rotateStart({
        pos: pos
      });
      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
    }
  }, {
    key: "_onPan",
    value: function _onPan(event) {
      var alternateMode = this.isFunctionKeyPressed(event) || event.rightButton;
      alternateMode = this.invertPan ? !alternateMode : alternateMode;
      return alternateMode ? this._onPanMove(event) : this._onPanRotate(event);
    }
  }, {
    key: "_onPanEnd",
    value: function _onPanEnd(event) {
      var newControllerState = this.controllerState.panEnd().rotateEnd();
      return this.updateViewport(newControllerState, null, {
        isDragging: false
      });
    }
  }, {
    key: "_onPanMove",
    value: function _onPanMove(event) {
      if (!this.dragPan) {
        return false;
      }

      var pos = this.getCenter(event);

      if (!this.isDragging()) {
        return false;
      }

      var newControllerState = this.controllerState.pan({
        pos: pos
      });
      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
    }
  }, {
    key: "_onPanRotate",
    value: function _onPanRotate(event) {
      if (!this.dragRotate) {
        return false;
      }

      var deltaX = event.deltaX,
          deltaY = event.deltaY;

      var _this$controllerState3 = this.controllerState.getViewportProps(),
          width = _this$controllerState3.width,
          height = _this$controllerState3.height;

      var deltaScaleX = deltaX / width;
      var deltaScaleY = deltaY / height;
      var newControllerState = this.controllerState.rotate({
        deltaScaleX: deltaScaleX,
        deltaScaleY: deltaScaleY
      });
      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
    }
  }, {
    key: "_onWheel",
    value: function _onWheel(event) {
      if (!this.scrollZoom) {
        return false;
      }

      event.preventDefault();
      var pos = this.getCenter(event);

      if (!this.isPointInBounds(pos)) {
        return false;
      }

      var delta = event.delta;
      var scale = 2 / (1 + Math.exp(-Math.abs(delta * ZOOM_ACCEL)));

      if (delta < 0 && scale !== 0) {
        scale = 1 / scale;
      }

      var newControllerState = this.controllerState.zoom({
        pos: pos,
        scale: scale
      });
      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS);
    }
  }, {
    key: "_onPinchStart",
    value: function _onPinchStart(event) {
      var pos = this.getCenter(event);

      if (!this.isPointInBounds(pos)) {
        return false;
      }

      var newControllerState = this.controllerState.zoomStart({
        pos: pos
      }).rotateStart({
        pos: pos
      });
      this._state.startPinchRotation = event.rotation;
      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
    }
  }, {
    key: "_onPinch",
    value: function _onPinch(event) {
      if (!this.touchZoom && !this.touchRotate) {
        return false;
      }

      var newControllerState = this.controllerState;

      if (this.touchZoom) {
        var scale = event.scale;
        var pos = this.getCenter(event);
        newControllerState = newControllerState.zoom({
          pos: pos,
          scale: scale
        });
      }

      if (this.touchRotate) {
        var rotation = event.rotation;
        var startPinchRotation = this._state.startPinchRotation;
        newControllerState = newControllerState.rotate({
          deltaScaleX: -(rotation - startPinchRotation) / 180
        });
      }

      return this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
    }
  }, {
    key: "_onPinchEnd",
    value: function _onPinchEnd(event) {
      var newControllerState = this.controllerState.zoomEnd().rotateEnd();
      this._state.startPinchRotation = 0;
      return this.updateViewport(newControllerState, null, {
        isDragging: false
      });
    }
  }, {
    key: "_onDoubleTap",
    value: function _onDoubleTap(event) {
      if (!this.doubleClickZoom) {
        return false;
      }

      var pos = this.getCenter(event);

      if (!this.isPointInBounds(pos)) {
        return false;
      }

      var isZoomOut = this.isFunctionKeyPressed(event);
      var newControllerState = this.controllerState.zoom({
        pos: pos,
        scale: isZoomOut ? 0.5 : 2
      });
      return this.updateViewport(newControllerState, this._getTransitionProps());
    }
  }, {
    key: "_onKeyDown",
    value: function _onKeyDown(event) {
      if (!this.keyboard) {
        return false;
      }

      var funcKey = this.isFunctionKeyPressed(event);
      var controllerState = this.controllerState;
      var newControllerState;

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
  }, {
    key: "_getTransitionProps",
    value: function _getTransitionProps() {
      return NO_TRANSITION_PROPS;
    }
  }]);
  return Controller;
}();

exports.default = Controller;
//# sourceMappingURL=controller.js.map