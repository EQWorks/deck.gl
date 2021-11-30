import { Framebuffer, Texture2D } from 'kepler-outdated-luma.gl-core';
export function getFloatTexture(gl, opts) {
  const {
    width = 1,
    height = 1
  } = opts;
  const texture = new Texture2D(gl, {
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
export function getFramebuffer(gl, opts) {
  const {
    id,
    width = 1,
    height = 1,
    texture
  } = opts;
  const fb = new Framebuffer(gl, {
    id,
    width,
    height,
    attachments: {
      [36064]: texture
    }
  });
  return fb;
}
export function getFloatArray(array, size) {
  let fillValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (!array || array.length < size) {
    return new Float32Array(size).fill(fillValue);
  }

  return array;
}
//# sourceMappingURL=gpu-grid-aggregator-utils.js.map