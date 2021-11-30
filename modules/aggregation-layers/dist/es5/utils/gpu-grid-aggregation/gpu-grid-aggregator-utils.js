"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFloatArray = getFloatArray;
exports.getFloatTexture = getFloatTexture;
exports.getFramebuffer = getFramebuffer;

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

function getFloatTexture(gl, opts) {
  const {
    width = 1,
    height = 1
  } = opts;
  const texture = new _keplerOutdatedLuma.Texture2D(gl, {
    data: null,
    format: 34836,
    type: 5126,
    border: 0,
    mipmaps: false,
    parameters: {
      [10240]: 9728,
      [10241]: 9728
    },
    dataFormat: 6408,
    width,
    height
  });
  return texture;
}

function getFramebuffer(gl, opts) {
  const {
    id,
    width = 1,
    height = 1,
    texture
  } = opts;
  const fb = new _keplerOutdatedLuma.Framebuffer(gl, {
    id,
    width,
    height,
    attachments: {
      [36064]: texture
    }
  });
  return fb;
}

function getFloatArray(array, size) {
  let fillValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (!array || array.length < size) {
    return new Float32Array(size).fill(fillValue);
  }

  return array;
}
//# sourceMappingURL=gpu-grid-aggregator-utils.js.map