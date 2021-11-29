"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-layers");

var _greatCircleVertex = _interopRequireDefault(require("./great-circle-vertex.glsl"));

class GreatCircleLayer extends _keplerOutdatedDeck.ArcLayer {
  getShaders() {
    const shaders = Object.assign({}, super.getShaders(), {
      vs: _greatCircleVertex.default,
      modules: ['picking', 'project32']
    });
    return shaders;
  }

}

exports.default = GreatCircleLayer;
GreatCircleLayer.layerName = 'GreatCircleLayer';
//# sourceMappingURL=great-circle-layer.js.map