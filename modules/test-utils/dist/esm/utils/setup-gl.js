import { createGLContext, setContextDefaults } from 'kepler-outdated-luma.gl-core';

const _global = typeof global !== 'undefined' ? global : window;

setContextDefaults({
  width: 1,
  height: 1,
  debug: true
});
_global.glContext = _global.glContext || createGLContext();
export default _global.glContext;
//# sourceMappingURL=setup-gl.js.map