"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TRANSITION_EVENTS = void 0;

var _linearInterpolator = _interopRequireDefault(require("../transitions/linear-interpolator"));

var _transition = _interopRequireDefault(require("../transitions/transition"));

var _assert = _interopRequireDefault(require("../utils/assert"));

const noop = () => {};

const TRANSITION_EVENTS = {
  BREAK: 1,
  SNAP_TO_END: 2,
  IGNORE: 3
};
exports.TRANSITION_EVENTS = TRANSITION_EVENTS;
const DEFAULT_PROPS = {
  transitionDuration: 0,
  transitionEasing: t => t,
  transitionInterpolator: new _linearInterpolator.default(),
  transitionInterruption: TRANSITION_EVENTS.BREAK,
  onTransitionStart: noop,
  onTransitionInterrupt: noop,
  onTransitionEnd: noop
};

class TransitionManager {
  constructor(ControllerState) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _assert.default)(ControllerState);
    this.ControllerState = ControllerState;
    this.props = Object.assign({}, DEFAULT_PROPS, props);
    this.propsInTransition = null;
    this.time = 0;
    this.transition = new _transition.default();
    this.onViewStateChange = props.onViewStateChange;
    this._onTransitionUpdate = this._onTransitionUpdate.bind(this);
  }

  finalize() {}

  getViewportInTransition() {
    return this.propsInTransition;
  }

  processViewStateChange(nextProps) {
    let transitionTriggered = false;
    const currentProps = this.props;
    nextProps = Object.assign({}, DEFAULT_PROPS, nextProps);
    this.props = nextProps;

    if (this._shouldIgnoreViewportChange(currentProps, nextProps)) {
      return transitionTriggered;
    }

    if (this._isTransitionEnabled(nextProps)) {
      const startProps = Object.assign({}, currentProps, this.transition.interruption === TRANSITION_EVENTS.SNAP_TO_END ? this.transition.endProps : this.propsInTransition || currentProps);

      this._triggerTransition(startProps, nextProps);

      transitionTriggered = true;
    } else {
      this.transition.cancel();
    }

    return transitionTriggered;
  }

  updateTransition(timestamp) {
    this.time = timestamp;

    this._updateTransition();
  }

  _isTransitionEnabled(props) {
    return props.transitionDuration > 0 && props.transitionInterpolator;
  }

  _isUpdateDueToCurrentTransition(props) {
    if (this.transition.inProgress) {
      return this.transition.interpolator.arePropsEqual(props, this.propsInTransition);
    }

    return false;
  }

  _shouldIgnoreViewportChange(currentProps, nextProps) {
    if (this.transition.inProgress) {
      return this.transition.interruption === TRANSITION_EVENTS.IGNORE || this._isUpdateDueToCurrentTransition(nextProps);
    } else if (this._isTransitionEnabled(nextProps)) {
      return nextProps.transitionInterpolator.arePropsEqual(currentProps, nextProps);
    }

    return true;
  }

  _triggerTransition(startProps, endProps) {
    (0, _assert.default)(this._isTransitionEnabled(endProps), 'Transition is not enabled');
    const startViewstate = new this.ControllerState(startProps);
    const endViewStateProps = new this.ControllerState(endProps).shortestPathFrom(startViewstate);
    const initialProps = endProps.transitionInterpolator.initializeProps(startProps, endViewStateProps);
    this.propsInTransition = {};
    this.transition.start({
      duration: endProps.transitionDuration,
      easing: endProps.transitionEasing,
      interpolator: endProps.transitionInterpolator,
      interruption: endProps.transitionInterruption,
      startProps: initialProps.start,
      endProps: initialProps.end,
      onStart: endProps.onTransitionStart,
      onUpdate: this._onTransitionUpdate,
      onInterrupt: this._onTransitionEnd(endProps.onTransitionInterrupt),
      onEnd: this._onTransitionEnd(endProps.onTransitionEnd)
    });

    this._updateTransition();
  }

  _updateTransition() {
    this.transition.update(this.time);
  }

  _onTransitionEnd(callback) {
    return transition => {
      this.propsInTransition = null;
      callback(transition);
    };
  }

  _onTransitionUpdate(transition) {
    const {
      interpolator,
      startProps,
      endProps,
      time
    } = transition;
    const viewport = interpolator.interpolateProps(startProps, endProps, time);
    this.propsInTransition = new this.ControllerState(Object.assign({}, this.props, viewport)).getViewportProps();

    if (this.onViewStateChange) {
      this.onViewStateChange({
        viewState: this.propsInTransition,
        interactionState: {
          inTransition: true
        }
      });
    }
  }

}

exports.default = TransitionManager;
TransitionManager.defaultProps = DEFAULT_PROPS;
//# sourceMappingURL=transition-manager.js.map