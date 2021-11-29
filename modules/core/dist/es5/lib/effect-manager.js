"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _deepEqual = require("../utils/deep-equal");

var _lightingEffect = _interopRequireDefault(require("../effects/lighting/lighting-effect"));

class EffectManager {
  constructor() {
    this.effects = [];
    this._needsRedraw = 'Initial render';
    this.defaultLightingEffect = new _lightingEffect.default();
    this.needApplyDefaultLighting = false;
  }

  setProps(props) {
    if ('effects' in props) {
      if (props.effects.length !== this.effects.length || !(0, _deepEqual.deepEqual)(props.effects, this.effects)) {
        this.setEffects(props.effects);
        this._needsRedraw = 'effects changed';
      }
    }

    this.checkLightingEffect();
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    return redraw;
  }

  getEffects() {
    let effects = this.effects;

    if (this.needApplyDefaultLighting) {
      effects = this.effects.slice();
      effects.push(this.defaultLightingEffect);
    }

    return effects;
  }

  finalize() {
    this.cleanup();
  }

  setEffects() {
    let effects = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    this.cleanup();
    this.effects = effects;
  }

  cleanup() {
    for (const effect of this.effects) {
      effect.cleanup();
    }

    this.effects.length = 0;
  }

  checkLightingEffect() {
    let hasEffect = false;

    for (const effect of this.effects) {
      if (effect instanceof _lightingEffect.default) {
        hasEffect = true;
        break;
      }
    }

    this.needApplyDefaultLighting = !hasEffect;
  }

}

exports.default = EffectManager;
//# sourceMappingURL=effect-manager.js.map