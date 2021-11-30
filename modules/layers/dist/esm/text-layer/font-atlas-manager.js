import { Texture2D } from 'kepler-outdated-luma.gl-core';
import TinySDF from '@mapbox/tiny-sdf';
import { buildMapping } from './font-atlas-utils';
import LRUCache from './lru-cache';

function getDefaultCharacterSet() {
  const charSet = [];

  for (let i = 32; i < 128; i++) {
    charSet.push(String.fromCharCode(i));
  }

  return charSet;
}

export const DEFAULT_CHAR_SET = getDefaultCharacterSet();
export const DEFAULT_FONT_FAMILY = 'Monaco, monospace';
export const DEFAULT_FONT_WEIGHT = 'normal';
export const DEFAULT_FONT_SIZE = 64;
export const DEFAULT_BUFFER = 2;
export const DEFAULT_CUTOFF = 0.25;
export const DEFAULT_RADIUS = 3;
const GL_TEXTURE_WRAP_S = 0x2802;
const GL_TEXTURE_WRAP_T = 0x2803;
const GL_CLAMP_TO_EDGE = 0x812f;
const MAX_CANVAS_WIDTH = 1024;
const BASELINE_SCALE = 0.9;
const HEIGHT_SCALE = 1.2;
const CACHE_LIMIT = 3;
const cache = new LRUCache(CACHE_LIMIT);
const VALID_PROPS = ['fontFamily', 'fontWeight', 'characterSet', 'fontSize', 'sdf', 'buffer', 'cutoff', 'radius'];

function getNewChars(key, characterSet) {
  const cachedFontAtlas = cache.get(key);

  if (!cachedFontAtlas) {
    return characterSet;
  }

  const newChars = [];
  const cachedMapping = cachedFontAtlas.mapping;
  let cachedCharSet = Object.keys(cachedMapping);
  cachedCharSet = new Set(cachedCharSet);
  let charSet = characterSet;

  if (charSet instanceof Array) {
    charSet = new Set(charSet);
  }

  charSet.forEach(char => {
    if (!cachedCharSet.has(char)) {
      newChars.push(char);
    }
  });
  return newChars;
}

function populateAlphaChannel(alphaChannel, imageData) {
  for (let i = 0; i < alphaChannel.length; i++) {
    imageData.data[4 * i + 3] = alphaChannel[i];
  }
}

function setTextStyle(ctx, fontFamily, fontSize, fontWeight) {
  ctx.font = "".concat(fontWeight, " ").concat(fontSize, "px ").concat(fontFamily);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'baseline';
  ctx.textAlign = 'left';
}

export default class FontAtlasManager {
  constructor(gl) {
    this.gl = gl;
    this.props = {
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: DEFAULT_FONT_WEIGHT,
      characterSet: DEFAULT_CHAR_SET,
      fontSize: DEFAULT_FONT_SIZE,
      buffer: DEFAULT_BUFFER,
      sdf: false,
      cutoff: DEFAULT_CUTOFF,
      radius: DEFAULT_RADIUS
    };
    this._key = null;
    this._texture = new Texture2D(this.gl);
  }

  finalize() {
    this._texture.delete();
  }

  get texture() {
    return this._texture;
  }

  get mapping() {
    const data = cache.get(this._key);
    return data && data.mapping;
  }

  get scale() {
    return HEIGHT_SCALE;
  }

  setProps() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    VALID_PROPS.forEach(prop => {
      if (prop in props) {
        this.props[prop] = props[prop];
      }
    });
    const oldKey = this._key;
    this._key = this._getKey();
    const charSet = getNewChars(this._key, this.props.characterSet);
    const cachedFontAtlas = cache.get(this._key);

    if (cachedFontAtlas && charSet.length === 0) {
      if (this._key !== oldKey) {
        this._updateTexture(cachedFontAtlas);
      }

      return;
    }

    const fontAtlas = this._generateFontAtlas(this._key, charSet, cachedFontAtlas);

    this._updateTexture(fontAtlas);

    cache.set(this._key, fontAtlas);
  }

  _updateTexture(_ref) {
    let {
      data: canvas,
      width,
      height
    } = _ref;

    if (this._texture.width !== width || this._texture.height !== height) {
      this._texture.resize({
        width,
        height
      });
    }

    this._texture.setImageData({
      data: canvas,
      width,
      height,
      parameters: {
        [GL_TEXTURE_WRAP_S]: GL_CLAMP_TO_EDGE,
        [GL_TEXTURE_WRAP_T]: GL_CLAMP_TO_EDGE,
        [37440]: true
      }
    });

    this._texture.generateMipmap();
  }

  _generateFontAtlas(key, characterSet, cachedFontAtlas) {
    const {
      fontFamily,
      fontWeight,
      fontSize,
      buffer,
      sdf,
      radius,
      cutoff
    } = this.props;
    let canvas = cachedFontAtlas && cachedFontAtlas.data;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = MAX_CANVAS_WIDTH;
    }

    const ctx = canvas.getContext('2d');
    setTextStyle(ctx, fontFamily, fontSize, fontWeight);
    const {
      mapping,
      canvasHeight,
      xOffset,
      yOffset
    } = buildMapping(Object.assign({
      getFontWidth: char => ctx.measureText(char).width,
      fontHeight: fontSize * HEIGHT_SCALE,
      buffer,
      characterSet,
      maxCanvasWidth: MAX_CANVAS_WIDTH
    }, cachedFontAtlas && {
      mapping: cachedFontAtlas.mapping,
      xOffset: cachedFontAtlas.xOffset,
      yOffset: cachedFontAtlas.yOffset
    }));

    if (canvas.height !== canvasHeight) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.height = canvasHeight;
      ctx.putImageData(imageData, 0, 0);
    }

    setTextStyle(ctx, fontFamily, fontSize, fontWeight);

    if (sdf) {
      const tinySDF = new TinySDF(fontSize, buffer, radius, cutoff, fontFamily, fontWeight);
      const imageData = ctx.getImageData(0, 0, tinySDF.size, tinySDF.size);

      for (const char of characterSet) {
        populateAlphaChannel(tinySDF.draw(char), imageData);
        ctx.putImageData(imageData, mapping[char].x - buffer, mapping[char].y - buffer);
      }
    } else {
      for (const char of characterSet) {
        ctx.fillText(char, mapping[char].x, mapping[char].y + fontSize * BASELINE_SCALE);
      }
    }

    return {
      xOffset,
      yOffset,
      mapping,
      data: canvas,
      width: canvas.width,
      height: canvas.height
    };
  }

  _getKey() {
    const {
      gl,
      fontFamily,
      fontWeight,
      fontSize,
      buffer,
      sdf,
      radius,
      cutoff
    } = this.props;

    if (sdf) {
      return "".concat(gl, " ").concat(fontFamily, " ").concat(fontWeight, " ").concat(fontSize, " ").concat(buffer, " ").concat(radius, " ").concat(cutoff);
    }

    return "".concat(gl, " ").concat(fontFamily, " ").concat(fontWeight, " ").concat(fontSize, " ").concat(buffer);
  }

}
//# sourceMappingURL=font-atlas-manager.js.map