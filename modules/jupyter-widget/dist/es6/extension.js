define(function () {
  'use strict';

  window['requirejs'].config({
    map: {
      '*': {
        'kepler-outdated-deck.gl-jupyter-widget': 'nbextensions/pydeck/index'
      }
    }
  });
  return {
    load_ipython_extension: function load_ipython_extension() {}
  };
});
//# sourceMappingURL=extension.js.map