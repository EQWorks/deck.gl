function parseColor(color, target) {
  let index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (Array.isArray(color) || ArrayBuffer.isView(color)) {
    if (!target && color.length === 4) {
      return color;
    }

    target = target || [];
    target[index + 0] = color[0];
    target[index + 1] = color[1];
    target[index + 2] = color[2];
    target[index + 3] = color.length === 4 ? color[4] : 255;
    return target;
  }

  if (typeof color === 'string') {
    target = target || [];
    parseHexColor(color, target, index);
    return target;
  }

  return [0, 0, 0, 255];
}

function parseHexColor(color, target, index) {
  if (color.length === 7) {
    const value = parseInt(color.substring(1), 16);
    target[index + 0] = Math.floor(value / 65536);
    target[index + 1] = Math.floor(value / 256 % 256);
    target[index + 2] = value % 256;
    target[index + 3] = 255;
  } else if (color.length === 9) {
    const value = parseInt(color.substring(1), 16);
    target[index + 0] = Math.floor(value / 16777216);
    target[index + 1] = Math.floor(value / 65536 % 256);
    target[index + 2] = Math.floor(value / 256 % 256);
    target[index + 3] = value % 256;
  }

  return index + 4;
}

function setOpacity(color) {
  let opacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 127;
  return [color[0], color[1], color[2], opacity];
}

function applyOpacity(color) {
  let opacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 127;
  return [color[0], color[1], color[2], opacity];
}

export default {
  parseColor,
  setOpacity,
  applyOpacity
};
//# sourceMappingURL=color.js.map