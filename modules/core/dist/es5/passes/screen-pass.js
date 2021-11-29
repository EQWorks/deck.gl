"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _pass = _interopRequireDefault(require("./pass"));

class ScreenPass extends _pass.default {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, props);
    const {
      module,
      fs,
      id,
      moduleProps
    } = props;
    this.model = this._getModel(gl, module, fs, id, moduleProps);
  }

  render(params) {
    const gl = this.gl;
    (0, _core.withParameters)(gl, {
      framebuffer: params.outputBuffer,
      clearColor: [0, 0, 0, 0]
    }, () => this._renderPass(gl, params));
  }

  delete() {
    this.model.delete();
    this.model = null;
  }

  _getModel(gl, module, fs, id, userProps) {
    const model = new _core.ClipSpace(gl, {
      id,
      fs,
      modules: [module]
    });
    const uniforms = Object.assign(module.getUniforms(), module.getUniforms(userProps));
    model.setUniforms(uniforms);
    return model;
  }

  _renderPass(gl, _ref) {
    let {
      inputBuffer,
      outputBuffer
    } = _ref;
    (0, _core.clear)(gl, {
      color: true
    });
    this.model.draw({
      uniforms: {
        texture: inputBuffer,
        texSize: [inputBuffer.width, inputBuffer.height]
      },
      parameters: {
        depthWrite: false,
        depthTest: false
      }
    });
  }

}

exports.default = ScreenPass;
//# sourceMappingURL=screen-pass.js.map