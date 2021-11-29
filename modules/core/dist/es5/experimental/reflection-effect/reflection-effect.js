"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _effect = _interopRequireDefault(require("../../lib/effect"));

var _webMercatorViewport = _interopRequireDefault(require("../../viewports/web-mercator-viewport"));

var _reflectionEffectVertex = _interopRequireDefault(require("./reflection-effect-vertex.glsl"));

var _reflectionEffectFragment = _interopRequireDefault(require("./reflection-effect-fragment.glsl"));

class ReflectionEffect extends _effect.default {
  constructor() {
    let reflectivity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
    let blur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;
    super();
    this.reflectivity = reflectivity;
    this.blur = blur;
    this.framebuffer = null;
    this.setNeedsRedraw();
  }

  getShaders() {
    return {
      vs: _reflectionEffectVertex.default,
      fs: _reflectionEffectFragment.default,
      modules: [],
      shaderCache: this.context.shaderCache
    };
  }

  initialize(_ref) {
    let {
      gl,
      layerManager
    } = _ref;
    this.unitQuad = new _core.Model(gl, Object.assign({}, this.getShaders(), {
      id: 'reflection-effect',
      geometry: new _core.Geometry({
        drawMode: 6,
        vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
      })
    }));
    this.framebuffer = new _core.Framebuffer(gl, {
      depth: true
    });
  }

  preDraw(_ref2) {
    let {
      gl,
      layerManager
    } = _ref2;
    const {
      viewport
    } = layerManager.context;
    const dpi = typeof window !== 'undefined' && window.devicePixelRatio || 1;
    this.framebuffer.resize({
      width: dpi * viewport.width,
      height: dpi * viewport.height
    });
    const pitch = viewport.pitch;
    this.framebuffer.bind();
    layerManager.setViewport(new _webMercatorViewport.default(Object.assign({}, viewport, {
      pitch: -180 - pitch
    })));
    gl.clear(16384 | 256);
    layerManager.drawLayers({
      pass: 'reflection'
    });
    layerManager.setViewport(viewport);
    this.framebuffer.unbind();
  }

  draw(_ref3) {
    let {
      gl,
      layerManager
    } = _ref3;
    this.unitQuad.render({
      reflectionTexture: this.framebuffer.texture,
      reflectionTextureWidth: this.framebuffer.width,
      reflectionTextureHeight: this.framebuffer.height,
      reflectivity: this.reflectivity,
      blur: this.blur
    });
  }

  finalize(_ref4) {
    let {
      gl,
      layerManager
    } = _ref4;
  }

}

exports.default = ReflectionEffect;
//# sourceMappingURL=reflection-effect.js.map