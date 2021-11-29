import { createGLContext, setContextDefaults } from '@luma.gl/core';

var _global = typeof global !== 'undefined' ? global : window;

setContextDefaults({
  width: 1,
  height: 1,
  debug: true
});
_global.glContext = _global.glContext || createGLContext();
export default _global.glContext;
//# sourceMappingURL=setup-gl.js.map