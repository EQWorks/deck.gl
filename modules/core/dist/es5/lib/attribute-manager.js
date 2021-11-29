"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _attribute = _interopRequireDefault(require("./attribute"));

var _log = _interopRequireDefault(require("../utils/log"));

var _attributeTransitionManager = _interopRequireDefault(require("./attribute-transition-manager"));

const LOG_START_END_PRIORITY = 2;
const LOG_DETAIL_PRIORITY = 3;

function noop() {}

const logFunctions = {
  savedMessages: null,
  timeStart: null,
  onLog: _ref => {
    let {
      level,
      message
    } = _ref;

    _log.default.log(level, message)();
  },
  onUpdateStart: _ref2 => {
    let {
      level,
      numInstances
    } = _ref2;
    logFunctions.savedMessages = [];
    logFunctions.timeStart = new Date();
  },
  onUpdate: _ref3 => {
    let {
      level,
      message
    } = _ref3;

    if (logFunctions.savedMessages) {
      logFunctions.savedMessages.push(message);
    }
  },
  onUpdateEnd: _ref4 => {
    let {
      level,
      id,
      numInstances
    } = _ref4;
    const timeMs = Math.round(new Date() - logFunctions.timeStart);
    const time = "".concat(timeMs, "ms");

    _log.default.group(level, "Updated attributes for ".concat(numInstances, " instances in ").concat(id, " in ").concat(time), {
      collapsed: true
    })();

    for (const message of logFunctions.savedMessages) {
      _log.default.log(level, message)();
    }

    _log.default.groupEnd(level, "Updated attributes for ".concat(numInstances, " instances in ").concat(id, " in ").concat(time))();

    logFunctions.savedMessages = null;
  }
};

class AttributeManager {
  static setDefaultLogFunctions() {
    let {
      onLog,
      onUpdateStart,
      onUpdate,
      onUpdateEnd
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (onLog !== undefined) {
      logFunctions.onLog = onLog || noop;
    }

    if (onUpdateStart !== undefined) {
      logFunctions.onUpdateStart = onUpdateStart || noop;
    }

    if (onUpdate !== undefined) {
      logFunctions.onUpdate = onUpdate || noop;
    }

    if (onUpdateEnd !== undefined) {
      logFunctions.onUpdateEnd = onUpdateEnd || noop;
    }
  }

  constructor(gl) {
    let {
      id = 'attribute-manager',
      stats
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.id = id;
    this.gl = gl;
    this.attributes = {};
    this.updateTriggers = {};
    this.accessors = {};
    this.needsRedraw = true;
    this.userData = {};
    this.stats = stats;
    this.attributeTransitionManager = new _attributeTransitionManager.default(gl, {
      id: "".concat(id, "-transitions")
    });
    Object.seal(this);
  }

  finalize() {
    for (const attributeName in this.attributes) {
      this.attributes[attributeName].delete();
    }

    this.attributeTransitionManager.finalize();
  }

  getNeedsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !opts.clearRedrawFlags;
    return redraw && this.id;
  }

  setNeedsRedraw() {
    let redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    this.needsRedraw = true;
    return this;
  }

  add(attributes, updaters) {
    this._add(attributes, updaters);
  }

  addInstanced(attributes, updaters) {
    this._add(attributes, updaters, {
      instanced: 1
    });
  }

  remove(attributeNameArray) {
    for (let i = 0; i < attributeNameArray.length; i++) {
      const name = attributeNameArray[i];

      if (this.attributes[name] !== undefined) {
        this.attributes[name].delete();
        delete this.attributes[name];
      }
    }
  }

  invalidate(triggerName, dataRange) {
    const invalidatedAttributes = this._invalidateTrigger(triggerName, dataRange);

    logFunctions.onLog({
      level: LOG_DETAIL_PRIORITY,
      message: "invalidated attributes ".concat(invalidatedAttributes, " (").concat(triggerName, ") for ").concat(this.id)
    });
  }

  invalidateAll(dataRange) {
    for (const attributeName in this.attributes) {
      this.attributes[attributeName].setNeedsUpdate(attributeName, dataRange);
    }

    logFunctions.onLog({
      level: LOG_DETAIL_PRIORITY,
      message: "invalidated all attributes for ".concat(this.id)
    });
  }

  update() {
    let {
      data,
      numInstances,
      bufferLayout,
      transitions,
      props = {},
      buffers = {},
      context = {}
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let updated = false;
    logFunctions.onUpdateStart({
      level: LOG_START_END_PRIORITY,
      id: this.id,
      numInstances
    });

    if (this.stats) {
      this.stats.get('Update Attributes').timeStart();
    }

    for (const attributeName in this.attributes) {
      const attribute = this.attributes[attributeName];

      if (attribute.setExternalBuffer(buffers[attributeName], this.numInstances)) {} else if (attribute.setGenericValue(props[attribute.getAccessor()])) {} else if (attribute.needsUpdate()) {
        updated = true;

        this._updateAttribute({
          attribute,
          numInstances,
          bufferLayout,
          data,
          props,
          context
        });
      }

      this.needsRedraw |= attribute.needsRedraw();
    }

    if (updated) {
      logFunctions.onUpdateEnd({
        level: LOG_START_END_PRIORITY,
        id: this.id,
        numInstances
      });
    }

    if (this.stats) {
      this.stats.get('Update Attributes').timeEnd();
    }

    this.attributeTransitionManager.update({
      attributes: this.attributes,
      numInstances,
      transitions
    });
  }

  updateTransition(timestamp) {
    const {
      attributeTransitionManager
    } = this;
    const transitionUpdated = attributeTransitionManager.setCurrentTime(timestamp);
    this.needsRedraw = this.needsRedraw || transitionUpdated;
    return transitionUpdated;
  }

  getAttributes() {
    return this.attributes;
  }

  getChangedAttributes() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearChangedFlags: false
    };
    const {
      attributes,
      attributeTransitionManager
    } = this;
    const changedAttributes = Object.assign({}, attributeTransitionManager.getAttributes());

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      if (attribute.needsRedraw(opts) && !attributeTransitionManager.hasAttribute(attributeName)) {
        changedAttributes[attributeName] = attribute;
      }
    }

    return changedAttributes;
  }

  getAccessors() {
    return this.updateTriggers;
  }

  _add(attributes, updaters) {
    let extraProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (updaters) {
      _log.default.warn('AttributeManager.add({updaters}) - updater map no longer supported')();
    }

    const newAttributes = {};

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      const newAttribute = this._createAttribute(attributeName, attribute, extraProps);

      newAttributes[attributeName] = newAttribute;
    }

    Object.assign(this.attributes, newAttributes);

    this._mapUpdateTriggersToAttributes();
  }

  _createAttribute(name, attribute, extraProps) {
    const props = {
      id: name,
      constant: attribute.constant || false,
      isIndexed: attribute.isIndexed || attribute.elements,
      size: attribute.elements && 1 || attribute.size,
      value: attribute.value || null,
      divisor: attribute.instanced || extraProps.instanced ? 1 : attribute.divisor
    };
    return new _attribute.default(this.gl, Object.assign({}, attribute, props));
  }

  _mapUpdateTriggersToAttributes() {
    const triggers = {};

    for (const attributeName in this.attributes) {
      const attribute = this.attributes[attributeName];
      attribute.getUpdateTriggers().forEach(triggerName => {
        if (!triggers[triggerName]) {
          triggers[triggerName] = [];
        }

        triggers[triggerName].push(attributeName);
      });
    }

    this.updateTriggers = triggers;
  }

  _invalidateTrigger(triggerName, dataRange) {
    const {
      attributes,
      updateTriggers
    } = this;
    const invalidatedAttributes = updateTriggers[triggerName];

    if (invalidatedAttributes) {
      invalidatedAttributes.forEach(name => {
        const attribute = attributes[name];

        if (attribute) {
          attribute.setNeedsUpdate(attribute.id, dataRange);
        }
      });
    } else {
      let message = "invalidating non-existent trigger ".concat(triggerName, " for ").concat(this.id, "\n");
      message += "Valid triggers: ".concat(Object.keys(attributes).join(', '));

      _log.default.warn(message, invalidatedAttributes)();
    }

    return invalidatedAttributes;
  }

  _updateAttribute(opts) {
    const {
      attribute,
      numInstances
    } = opts;

    if (attribute.allocate(numInstances)) {
      logFunctions.onUpdate({
        level: LOG_DETAIL_PRIORITY,
        message: "".concat(attribute.id, " allocated ").concat(numInstances),
        id: this.id
      });
    }

    const timeStart = Date.now();
    const updated = attribute.updateBuffer(opts);

    if (updated) {
      this.needsRedraw = true;
      const timeMs = Math.round(Date.now() - timeStart);
      logFunctions.onUpdate({
        level: LOG_DETAIL_PRIORITY,
        message: "".concat(attribute.id, " updated ").concat(numInstances, " in ").concat(timeMs, "ms")
      });
    }
  }

}

exports.default = AttributeManager;
//# sourceMappingURL=attribute-manager.js.map