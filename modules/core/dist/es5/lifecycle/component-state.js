"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _log = _interopRequireDefault(require("../utils/log"));

var _assert = _interopRequireDefault(require("../utils/assert"));

const EMPTY_PROPS = Object.freeze({});

class ComponentState {
  constructor() {
    let component = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    this.component = component;
    this.asyncProps = {};

    this.onAsyncPropUpdated = () => {};

    this.oldProps = EMPTY_PROPS;
    this.oldAsyncProps = null;
  }

  getOldProps() {
    return this.oldAsyncProps || this.oldProps;
  }

  resetOldProps() {
    this.oldAsyncProps = null;
    this.oldProps = this.component.props;
  }

  freezeAsyncOldProps() {
    if (!this.oldAsyncProps) {
      this.oldProps = this.oldProps || this.component.props;
      this.oldAsyncProps = {};

      for (const propName in this.oldProps) {
        this.oldAsyncProps[propName] = this.oldProps[propName];
      }
    }
  }

  hasAsyncProp(propName) {
    return propName in this.asyncProps;
  }

  getAsyncProp(propName) {
    const asyncProp = this.asyncProps[propName];
    return asyncProp && asyncProp.resolvedValue;
  }

  isAsyncPropLoading(propName) {
    const asyncProp = this.asyncProps[propName];
    return Boolean(asyncProp && asyncProp.pendingLoadCount > 0 && asyncProp.pendingLoadCount !== asyncProp.resolvedLoadCount);
  }

  setAsyncProps(props) {
    const resolvedValues = props._asyncPropResolvedValues || {};
    const originalValues = props._asyncPropOriginalValues || props;
    const defaultValues = props._asyncPropDefaultValues || {};

    for (const propName in resolvedValues) {
      const value = resolvedValues[propName];

      this._createAsyncPropData(propName, value, defaultValues[propName]);

      this._updateAsyncProp(propName, value);
    }

    for (const propName in originalValues) {
      const value = originalValues[propName];

      this._createAsyncPropData(propName, value, defaultValues[propName]);

      this._updateAsyncProp(propName, value);
    }
  }

  _updateAsyncProp(propName, value) {
    if (!this._didAsyncInputValueChange(propName, value)) {
      return;
    }

    if (typeof value === 'string') {
      const {
        fetch
      } = this.layer.props;
      const url = value;
      value = fetch(url, {
        propName,
        layer: this.layer
      });
    }

    if (value instanceof Promise) {
      this._watchPromise(propName, value);

      return;
    }

    this._setPropValue(propName, value);
  }

  _didAsyncInputValueChange(propName, value) {
    const asyncProp = this.asyncProps[propName];

    if (value === asyncProp.lastValue) {
      return false;
    }

    asyncProp.lastValue = value;
    return true;
  }

  _setPropValue(propName, value) {
    const asyncProp = this.asyncProps[propName];
    asyncProp.value = value;
    asyncProp.resolvedValue = value;
    asyncProp.pendingLoadCount++;
    asyncProp.resolvedLoadCount = asyncProp.pendingLoadCount;
  }

  _setAsyncPropValue(propName, value, loadCount) {
    const asyncProp = this.asyncProps[propName];

    if (asyncProp && loadCount >= asyncProp.resolvedLoadCount) {
      (0, _assert.default)(value !== undefined);
      this.freezeAsyncOldProps();
      value = this._postProcessValue(propName, value);
      asyncProp.resolvedValue = value;
      asyncProp.resolvedLoadCount = loadCount;
      this.onAsyncPropUpdated(propName, value);
    }
  }

  _watchPromise(propName, promise) {
    const asyncProp = this.asyncProps[propName];
    asyncProp.pendingLoadCount++;
    const loadCount = asyncProp.pendingLoadCount;
    promise.then(data => this._setAsyncPropValue(propName, data, loadCount)).catch(error => _log.default.error(error)());
  }

  _postProcessValue(propName, value) {
    const {
      dataTransform
    } = this.component ? this.component.props : {};

    if (propName === 'data' && dataTransform) {
      value = dataTransform(value);
    }

    return value;
  }

  _createAsyncPropData(propName, value, defaultValue) {
    const asyncProp = this.asyncProps[propName];

    if (!asyncProp) {
      this.asyncProps[propName] = {
        lastValue: null,
        resolvedValue: defaultValue,
        pendingLoadCount: 0,
        resolvedLoadCount: 0
      };
    }
  }

}

exports.default = ComponentState;
//# sourceMappingURL=component-state.js.map