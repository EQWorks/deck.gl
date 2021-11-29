import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { ClipSpace, withParameters, clear } from '@luma.gl/core';
import Pass from './pass';

var ScreenPass = function (_Pass) {
  _inherits(ScreenPass, _Pass);

  function ScreenPass(gl) {
    var _this;

    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ScreenPass);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ScreenPass).call(this, gl, props));
    var module = props.module,
        fs = props.fs,
        id = props.id,
        moduleProps = props.moduleProps;
    _this.model = _this._getModel(gl, module, fs, id, moduleProps);
    return _this;
  }

  _createClass(ScreenPass, [{
    key: "render",
    value: function render(params) {
      var _this2 = this;

      var gl = this.gl;
      withParameters(gl, {
        framebuffer: params.outputBuffer,
        clearColor: [0, 0, 0, 0]
      }, function () {
        return _this2._renderPass(gl, params);
      });
    }
  }, {
    key: "delete",
    value: function _delete() {
      this.model.delete();
      this.model = null;
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl, module, fs, id, userProps) {
      var model = new ClipSpace(gl, {
        id: id,
        fs: fs,
        modules: [module]
      });
      var uniforms = Object.assign(module.getUniforms(), module.getUniforms(userProps));
      model.setUniforms(uniforms);
      return model;
    }
  }, {
    key: "_renderPass",
    value: function _renderPass(gl, _ref) {
      var inputBuffer = _ref.inputBuffer,
          outputBuffer = _ref.outputBuffer;
      clear(gl, {
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
  }]);

  return ScreenPass;
}(Pass);

export { ScreenPass as default };
//# sourceMappingURL=screen-pass.js.map