"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "\n#define SHADER_NAME simple-mesh-layer-fs\n\n// Note(Tarek): headless-gl supports derivatives, but doesn't report it via getExtension. Awesome!\n#ifdef DERIVATIVES\n#define FLAT_SHADE_NORMAL normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)))\n#else\n#define FLAT_SHADE_NORMAL vec3(0.0, 0.0, 1.0)\n#endif\n\nprecision highp float;\n\nuniform bool hasTexture;\nuniform sampler2D sampler;\nuniform vec4 color;\nuniform bool flatShading;\n\nvarying vec2 vTexCoord;\nvarying vec3 cameraPosition;\nvarying vec3 normals_commonspace;\nvarying vec4 position_commonspace;\nvarying vec4 vColor;\n\nvoid main(void) {\n  vec3 normal;\n  if (flatShading) {\n    normal = FLAT_SHADE_NORMAL;\n  } else {\n    normal = normals_commonspace;\n  }\n\n  vec4 color = hasTexture ? texture2D(sampler, vTexCoord) : vColor / 255.;\n  vec3 lightColor = lighting_getLightColor(color.rgb * 255., cameraPosition, position_commonspace.xyz, normal);\n  gl_FragColor = vec4(lightColor / 255., color.a);\n\n  // use highlight color if this fragment belongs to the selected object.\n  gl_FragColor = picking_filterHighlightColor(gl_FragColor);\n\n  // use picking color if rendering to picking FBO.\n  gl_FragColor = picking_filterPickingColor(gl_FragColor);\n}\n";
exports.default = _default;
//# sourceMappingURL=simple-mesh-layer-fragment.glsl1.js.map