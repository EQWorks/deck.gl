"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = require("../lifecycle/constants");

var _createProps = require("../lifecycle/create-props");

var _componentState = _interopRequireDefault(require("./component-state"));

const defaultProps = {};
let counter = 0;

class Component {
  constructor() {
    this.props = _createProps.createProps.apply(this, arguments);
    this.id = this.props.id;
    this.count = counter++;
    this.lifecycle = _constants.LIFECYCLE.NO_STATE;
    this.parent = null;
    this.context = null;
    this.state = null;
    this.internalState = null;
    Object.seal(this);
  }

  clone(newProps) {
    const {
      props
    } = this;
    const asyncProps = {};

    for (const key in props._asyncPropDefaultValues) {
      if (key in props._asyncPropResolvedValues) {
        asyncProps[key] = props._asyncPropResolvedValues[key];
      } else if (key in props._asyncPropOriginalValues) {
        asyncProps[key] = props._asyncPropOriginalValues[key];
      }
    }

    return new this.constructor(Object.assign({}, props, asyncProps, newProps));
  }

  get stats() {
    return this.internalState.stats;
  }

  _initState() {
    this.internalState = new _componentState.default({});
  }

}

exports.default = Component;
Component.componentName = 'Component';
Component.defaultProps = defaultProps;
//# sourceMappingURL=component.js.map