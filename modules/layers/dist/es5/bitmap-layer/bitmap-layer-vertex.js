"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "\n#define SHADER_NAME bitmap-layer-vertex-shader\n\nattribute vec2 texCoords;\nattribute vec3 positions;\nattribute vec2 positions64xyLow;\nattribute vec3 instancePickingColors;\n\nvarying vec2 vTexCoord;\n\nvoid main(void) {\n  gl_Position = project_position_to_clipspace(positions, positions64xyLow, vec3(0.0));\n \n  vTexCoord = texCoords;\n \n  picking_setPickingColor(instancePickingColors);\n}\n";
exports.default = _default;
//# sourceMappingURL=bitmap-layer-vertex.js.map