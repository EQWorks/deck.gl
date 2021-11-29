"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "\n#define SHADER_NAME simple-mesh-layer-vs\n\n// Scale the model\nuniform float sizeScale;\n\n// Primitive attributes\nattribute vec3 positions;\nattribute vec3 normals;\nattribute vec2 texCoords;\n\n// Instance attributes\nattribute vec3 instancePositions;\nattribute vec2 instancePositions64xy;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\nattribute mat3 instanceModelMatrix;\nattribute vec3 instanceTranslation;\n\n// Outputs to fragment shader\nvarying vec2 vTexCoord;\nvarying vec3 cameraPosition;\nvarying vec3 normals_commonspace;\nvarying vec4 position_commonspace;\nvarying vec4 vColor;\n\nvoid main(void) {\n  vec3 pos = (instanceModelMatrix * positions) * sizeScale + instanceTranslation;\n  pos = project_size(pos);\n\n  vTexCoord = texCoords;\n  cameraPosition = project_uCameraPosition;\n  normals_commonspace = project_normal(instanceModelMatrix * normals);\n  vColor = instanceColors;\n\n  gl_Position = project_position_to_clipspace(instancePositions, instancePositions64xy, pos, position_commonspace);\n\n  picking_setPickingColor(instancePickingColors);\n}\n";
exports.default = _default;
//# sourceMappingURL=simple-mesh-layer-vertex.glsl1.js.map