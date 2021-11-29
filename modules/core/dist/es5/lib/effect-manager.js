"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _deepEqual = require("../utils/deep-equal");

var _lightingEffect = _interopRequireDefault(require("../effects/lighting/lighting-effect"));

var EffectManager = function () {
  function EffectManager() {
    (0, _classCallCheck2.default)(this, EffectManager);
    this.effects = [];
    this._needsRedraw = 'Initial render';
    this.defaultLightingEffect = new _lightingEffect.default();
    this.needApplyDefaultLighting = false;
  }

  (0, _createClass2.default)(EffectManager, [{
    key: "setProps",
    value: function setProps(props) {
      if ('effects' in props) {
        if (props.effects.length !== this.effects.length || !(0, _deepEqual.deepEqual)(props.effects, this.effects)) {
          this.setEffects(props.effects);
          this._needsRedraw = 'effects changed';
        }
      }

      this.checkLightingEffect();
    }
  }, {
    key: "needsRedraw",
    value: function needsRedraw() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        clearRedrawFlags: false
      };
      var redraw = this._needsRedraw;

      if (opts.clearRedrawFlags) {
        this._needsRedraw = false;
      }

      return redraw;
    }
  }, {
    key: "getEffects",
    value: function getEffects() {
      var effects = this.effects;

      if (this.needApplyDefaultLighting) {
        effects = this.effects.slice();
        effects.push(this.defaultLightingEffect);
      }

      return effects;
    }
  }, {
    key: "finalize",
    value: function finalize() {
      this.cleanup();
    }
  }, {
    key: "setEffects",
    value: function setEffects() {
      var effects = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      this.cleanup();
      this.effects = effects;
    }
  }, {
    key: "cleanup",
    value: function cleanup() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.effects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var effect = _step.value;
          effect.cleanup();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.effects.length = 0;
    }
  }, {
    key: "checkLightingEffect",
    value: function checkLightingEffect() {
      var hasEffect = false;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.effects[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var effect = _step2.value;

          if (effect instanceof _lightingEffect.default) {
            hasEffect = true;
            break;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this.needApplyDefaultLighting = !hasEffect;
    }
  }]);
  return EffectManager;
}();

exports.default = EffectManager;
//# sourceMappingURL=effect-manager.js.map