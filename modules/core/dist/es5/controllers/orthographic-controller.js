"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _controller = _interopRequireDefault(require("./controller"));

var _orbitController = require("./orbit-controller");

var _linearInterpolator = _interopRequireDefault(require("../transitions/linear-interpolator"));

var _transitionManager = require("./transition-manager");

const LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: t => t,
  transitionInterpolator: new _linearInterpolator.default(['target', 'zoom']),
  transitionInterruption: _transitionManager.TRANSITION_EVENTS.BREAK
};

class OrthographicController extends _controller.default {
  constructor(props) {
    super(_orbitController.OrbitState, props);
    this.invertPan = true;
  }

  _onPanRotate(event) {
    return false;
  }

  _getTransitionProps() {
    return LINEAR_TRANSITION_PROPS;
  }

}

exports.default = OrthographicController;
//# sourceMappingURL=orthographic-controller.js.map