"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Effect {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = 'effect'
    } = props;
    this.id = id;
    this.props = {};
    Object.assign(this.props, props);
  }

  prepare() {}

  getParameters() {}

  cleanup() {}

}

exports.default = Effect;
//# sourceMappingURL=effect.js.map