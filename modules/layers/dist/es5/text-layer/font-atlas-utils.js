"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildMapping = buildMapping;
exports.nextPowOfTwo = nextPowOfTwo;

function nextPowOfTwo(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}

function buildMapping(_ref) {
  let {
    characterSet,
    getFontWidth,
    fontHeight,
    buffer,
    maxCanvasWidth,
    mapping = {},
    xOffset = 0,
    yOffset = 0
  } = _ref;
  let row = 0;
  let x = xOffset;
  Array.from(characterSet).forEach((char, i) => {
    if (!mapping[char]) {
      const width = getFontWidth(char, i);

      if (x + width + buffer * 2 > maxCanvasWidth) {
        x = 0;
        row++;
      }

      mapping[char] = {
        x: x + buffer,
        y: yOffset + row * (fontHeight + buffer * 2) + buffer,
        width,
        height: fontHeight,
        mask: true
      };
      x += width + buffer * 2;
    }
  });
  const rowHeight = fontHeight + buffer * 2;
  return {
    mapping,
    xOffset: x,
    yOffset: yOffset + row * rowHeight,
    canvasHeight: nextPowOfTwo(yOffset + (row + 1) * rowHeight)
  };
}
//# sourceMappingURL=font-atlas-utils.js.map