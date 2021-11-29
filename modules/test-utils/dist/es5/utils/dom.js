"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBoundingBoxInPage = getBoundingBoxInPage;

function getBoundingBoxInPage(domElement) {
  const bbox = domElement.getBoundingClientRect();
  return {
    x: window.scrollX + bbox.x,
    y: window.scrollY + bbox.y,
    width: bbox.width,
    height: bbox.height
  };
}
//# sourceMappingURL=dom.js.map