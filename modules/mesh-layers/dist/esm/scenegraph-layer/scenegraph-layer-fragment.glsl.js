export default "#if (__VERSION__ < 300)\n  #define _varying varying\n  #define _texture2D texture2D\n  #define fragmentColor gl_FragColor\n#else\n  #define _varying in\n  #define _texture2D texture\n  out vec4 fragmentColor;\n#endif\n#ifndef MODULE_PBR\n  _varying vec4 vColor;\n\n  #if defined(HAS_UV) && defined(HAS_BASECOLORMAP)\n    _varying vec2 vTEXCOORD_0;\n    uniform sampler2D u_BaseColorSampler;\n  #endif\n#endif\n\nvoid main(void) {\n  #ifdef MODULE_PBR\n    fragmentColor = pbr_filterColor(vec4(0));\n  #else\n    #if defined(HAS_UV) && defined(HAS_BASECOLORMAP)\n      fragmentColor = vColor * _texture2D(u_BaseColorSampler, vTEXCOORD_0);\n    #else\n      fragmentColor = vColor;\n    #endif\n  #endif\n\n  fragmentColor = picking_filterPickingColor(fragmentColor);\n}\n";
//# sourceMappingURL=scenegraph-layer-fragment.glsl.js.map