"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildMapping = buildMapping;
exports.default = void 0;
exports.getDiffIcons = getDiffIcons;

var _core = require("@luma.gl/core");

var _images = require("@loaders.gl/images");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

const DEFAULT_CANVAS_WIDTH = 1024;
const DEFAULT_BUFFER = 4;

const noop = () => {};

const DEFAULT_TEXTURE_PARAMETERS = {
  [10241]: 9987,
  [10240]: 9729
};

function nextPowOfTwo(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}

function resizeImage(ctx, imageData, width, height) {
  const {
    naturalWidth,
    naturalHeight
  } = imageData;

  if (width === naturalWidth && height === naturalHeight) {
    return imageData;
  }

  ctx.canvas.height = height;
  ctx.canvas.width = width;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(imageData, 0, 0, naturalWidth, naturalHeight, 0, 0, width, height);
  return ctx.canvas;
}

function getIconId(icon) {
  return icon && (icon.id || icon.url);
}

function buildRowMapping(mapping, columns, yOffset) {
  for (let i = 0; i < columns.length; i++) {
    const {
      icon,
      xOffset
    } = columns[i];
    const id = getIconId(icon);
    mapping[id] = Object.assign({}, icon, {
      x: xOffset,
      y: yOffset
    });
  }
}

function resizeTexture(texture, width, height) {
  const oldWidth = texture.width;
  const oldHeight = texture.height;
  const oldPixels = (0, _core.readPixelsToBuffer)(texture, {});
  texture.resize({
    width,
    height
  });
  texture.setSubImageData({
    data: oldPixels,
    x: 0,
    y: height - oldHeight,
    width: oldWidth,
    height: oldHeight,
    parameters: DEFAULT_TEXTURE_PARAMETERS
  });
  texture.generateMipmap();
  oldPixels.delete();
  return texture;
}

function buildMapping(_ref) {
  let {
    icons,
    buffer,
    mapping = {},
    xOffset = 0,
    yOffset = 0,
    canvasWidth
  } = _ref;
  let rowHeight = 0;
  let columns = [];

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const id = getIconId(icon);

    if (!mapping[id]) {
      const {
        height,
        width
      } = icon;

      if (xOffset + width + buffer > canvasWidth) {
        buildRowMapping(mapping, columns, yOffset);
        xOffset = 0;
        yOffset = rowHeight + yOffset + buffer;
        rowHeight = 0;
        columns = [];
      }

      columns.push({
        icon,
        xOffset
      });
      xOffset = xOffset + width + buffer;
      rowHeight = Math.max(rowHeight, height);
    }
  }

  if (columns.length > 0) {
    buildRowMapping(mapping, columns, yOffset);
  }

  return {
    mapping,
    xOffset,
    yOffset,
    canvasWidth,
    canvasHeight: nextPowOfTwo(rowHeight + yOffset + buffer)
  };
}

function getDiffIcons(data, getIcon, cachedIcons) {
  if (!data || !getIcon) {
    return null;
  }

  cachedIcons = cachedIcons || {};
  const icons = {};
  const {
    iterable,
    objectInfo
  } = (0, _keplerOutdatedDeck.createIterable)(data);

  for (const object of iterable) {
    objectInfo.index++;
    const icon = getIcon(object, objectInfo);
    const id = getIconId(icon);

    if (!icon) {
      throw new Error('Icon is missing.');
    }

    if (!icon.url) {
      throw new Error('Icon url is missing.');
    }

    if (!icons[id] && (!cachedIcons[id] || icon.url !== cachedIcons[id].url)) {
      icons[id] = icon;
    }
  }

  return icons;
}

class IconManager {
  constructor(gl, _ref2) {
    let {
      onUpdate = noop
    } = _ref2;
    this.gl = gl;
    this.onUpdate = onUpdate;
    this._getIcon = null;
    this._texture = null;
    this._externalTexture = null;
    this._mapping = {};
    this._autoPacking = false;
    this._xOffset = 0;
    this._yOffset = 0;
    this._buffer = DEFAULT_BUFFER;
    this._canvasWidth = DEFAULT_CANVAS_WIDTH;
    this._canvasHeight = 0;
    this._canvas = null;
  }

  finalize() {
    if (this._texture) {
      this._texture.delete();
    }
  }

  getTexture() {
    return this._texture || this._externalTexture;
  }

  getIconMapping(object, objectInfo) {
    const icon = this._getIcon(object, objectInfo);

    const id = this._autoPacking ? getIconId(icon) : icon;
    return this._mapping[id] || {};
  }

  setProps(_ref3) {
    let {
      autoPacking,
      iconAtlas,
      iconMapping,
      data,
      getIcon
    } = _ref3;

    if (autoPacking !== undefined) {
      this._autoPacking = autoPacking;
    }

    if (getIcon) {
      this._getIcon = getIcon;
    }

    if (iconMapping) {
      this._mapping = iconMapping;
    }

    if (iconAtlas) {
      this._updateIconAtlas(iconAtlas);
    }

    if (this._autoPacking && (data || getIcon) && typeof document !== 'undefined') {
      this._canvas = this._canvas || document.createElement('canvas');

      this._updateAutoPacking(data);
    }
  }

  _updateIconAtlas(iconAtlas) {
    if (this._texture) {
      this._texture.delete();

      this._texture = null;
    }

    if (iconAtlas instanceof _core.Texture2D) {
      iconAtlas.setParameters(DEFAULT_TEXTURE_PARAMETERS);
      this._externalTexture = iconAtlas;
      this.onUpdate();
    } else if (typeof iconAtlas === 'string') {
      (0, _images.loadImage)(iconAtlas).then(data => {
        this._texture = new _core.Texture2D(this.gl, {
          data,
          parameters: DEFAULT_TEXTURE_PARAMETERS
        });
        this.onUpdate();
      });
    }
  }

  _updateAutoPacking(data) {
    const icons = Object.values(getDiffIcons(data, this._getIcon, this._mapping) || {});

    if (icons.length > 0) {
      const {
        mapping,
        xOffset,
        yOffset,
        canvasHeight
      } = buildMapping({
        icons,
        buffer: this._buffer,
        canvasWidth: this._canvasWidth,
        mapping: this._mapping,
        xOffset: this._xOffset,
        yOffset: this._yOffset
      });
      this._mapping = mapping;
      this._xOffset = xOffset;
      this._yOffset = yOffset;
      this._canvasHeight = canvasHeight;

      if (!this._texture) {
        this._texture = new _core.Texture2D(this.gl, {
          width: this._canvasWidth,
          height: this._canvasHeight,
          parameters: DEFAULT_TEXTURE_PARAMETERS
        });
      }

      if (this._texture.height !== this._canvasHeight) {
        resizeTexture(this._texture, this._canvasWidth, this._canvasHeight);
      }

      this.onUpdate();

      this._loadIcons(icons);
    }
  }

  _loadIcons(icons) {
    const ctx = this._canvas.getContext('2d');

    const canvasHeight = this._texture.height;

    for (const icon of icons) {
      (0, _images.loadImage)(icon.url).then(imageData => {
        const id = getIconId(icon);
        const {
          x,
          y,
          width,
          height
        } = this._mapping[id];
        const data = resizeImage(ctx, imageData, width, height);

        this._texture.setSubImageData({
          data,
          x,
          y: canvasHeight - y - height,
          width,
          height,
          parameters: Object.assign({}, DEFAULT_TEXTURE_PARAMETERS, {
            [37440]: true
          })
        });

        this._texture.generateMipmap();

        this.onUpdate();
      });
    }
  }

}

exports.default = IconManager;
//# sourceMappingURL=icon-manager.js.map