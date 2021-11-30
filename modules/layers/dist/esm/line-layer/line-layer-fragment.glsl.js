export default "#define SHADER_NAME line-layer-fragment-shader\n\nprecision highp float;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n  gl_FragColor = picking_filterHighlightColor(gl_FragColor);\n  gl_FragColor = picking_filterPickingColor(gl_FragColor);\n}\n";
//# sourceMappingURL=line-layer-fragment.glsl.js.map