"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#version 300 es\n#define SHADER_NAME simple-mesh-layer-fs\n\nprecision highp float;\n\nuniform bool hasTexture;\nuniform sampler2D sampler;\nuniform vec4 color;\nuniform bool flatShading;\n\nin vec2 vTexCoord;\nin vec3 cameraPosition;\nin vec3 normals_commonspace;\nin vec4 position_commonspace;\nin vec4 vColor;\n\nout vec4 fragColor;\n\nvoid main(void) {\n  vec3 normal;\n  if (flatShading) {\n    normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));\n  } else {\n    normal = normals_commonspace;\n  }\n\n  vec4 color = hasTexture ? texture(sampler, vTexCoord) : vColor / 255.;\n  vec3 lightColor = lighting_getLightColor(color.rgb * 255., cameraPosition, position_commonspace.xyz, normal);\n  fragColor = vec4(lightColor / 255., color.a);\n  fragColor = picking_filterHighlightColor(fragColor);\n  fragColor = picking_filterPickingColor(fragColor);\n}\n";
exports.default = _default;
//# sourceMappingURL=simple-mesh-layer-fragment.glsl.js.map