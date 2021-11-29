"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPosition = getPosition;
exports.parsePosition = parsePosition;
const PERCENT_OR_PIXELS_REGEX = /([0-9]+\.?[0-9]*)(%|px)/;

function parsePosition(value) {
  switch (typeof value) {
    case 'number':
      return {
        position: value,
        relative: false
      };

    case 'string':
      const match = value.match(PERCENT_OR_PIXELS_REGEX);

      if (match && match.length >= 3) {
        const relative = match[2] === '%';
        const position = parseFloat(match[1]);
        return {
          position: relative ? position / 100 : position,
          relative
        };
      }

    default:
      throw new Error("Could not parse position string ".concat(value));
  }
}

function getPosition(position, extent) {
  return position.relative ? Math.round(position.position * extent) : position.position;
}
//# sourceMappingURL=positions.js.map