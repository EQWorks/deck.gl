"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _effect = _interopRequireDefault(require("../lib/effect"));

var _screenPass = _interopRequireDefault(require("../passes/screen-pass"));

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-shadertools");

class PostProcessEffect extends _effect.default {
  constructor(module) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(props);
    this.id = "".concat(module.name, "-pass");
    (0, _keplerOutdatedLuma.normalizeShaderModule)(module);
    this.module = module;
  }

  prepare(gl) {
    if (!this.passes) {
      this.passes = createPasses(gl, this.module, this.id, this.props);
    }
  }

  render(params) {
    const {
      target = null
    } = params;
    let switchBuffer = false;

    for (let index = 0; index < this.passes.length; index++) {
      const inputBuffer = switchBuffer ? params.outputBuffer : params.inputBuffer;
      let outputBuffer = switchBuffer ? params.inputBuffer : params.outputBuffer;

      if (target && index === this.passes.length - 1) {
        outputBuffer = target;
      }

      this.passes[index].render({
        inputBuffer,
        outputBuffer
      });
      switchBuffer = !switchBuffer;
    }

    return {
      inputBuffer: switchBuffer ? params.outputBuffer : params.inputBuffer,
      outputBuffer: switchBuffer ? params.inputBuffer : params.outputBuffer
    };
  }

  cleanup() {
    if (this.passes) {
      for (const pass of this.passes) {
        pass.delete();
      }

      this.passes = null;
    }
  }

}

exports.default = PostProcessEffect;

function createPasses(gl, module, id, moduleProps) {
  if (module.filter || module.sampler) {
    const fs = getFragmentShaderForRenderPass(module);
    const pass = new _screenPass.default(gl, {
      id,
      module,
      fs,
      moduleProps
    });
    return [pass];
  }

  const passes = module.passes || [];
  return passes.map((pass, index) => {
    const fs = getFragmentShaderForRenderPass(module, pass);
    const idn = "".concat(id, "-").concat(index);
    return new _screenPass.default(gl, {
      id: idn,
      module,
      fs,
      moduleProps
    });
  });
}

const FILTER_FS_TEMPLATE = func => "uniform sampler2D texture;\nuniform vec2 texSize;\n\nvarying vec2 position;\nvarying vec2 coordinate;\nvarying vec2 uv;\n\nvoid main() {\n  vec2 texCoord = coordinate;\n\n  gl_FragColor = texture2D(texture, texCoord);\n  gl_FragColor = ".concat(func, "(gl_FragColor, texSize, texCoord);\n}\n");

const SAMPLER_FS_TEMPLATE = func => "uniform sampler2D texture;\nuniform vec2 texSize;\n\nvarying vec2 position;\nvarying vec2 coordinate;\nvarying vec2 uv;\n\nvoid main() {\n  vec2 texCoord = coordinate;\n\n  gl_FragColor = ".concat(func, "(texture, texSize, texCoord);\n}\n");

function getFragmentShaderForRenderPass(module) {
  let pass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : module;

  if (pass.filter) {
    const func = typeof pass.filter === 'string' ? pass.filter : "".concat(module.name, "_filterColor");
    return FILTER_FS_TEMPLATE(func);
  }

  if (pass.sampler) {
    const func = typeof pass.sampler === 'string' ? pass.sampler : "".concat(module.name, "_sampleColor");
    return SAMPLER_FS_TEMPLATE(func);
  }

  return null;
}
//# sourceMappingURL=post-process-effect.js.map