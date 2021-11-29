"use strict";

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
    load_ipython_extension: function () {}
  };
});
//# sourceMappingURL=extension.js.map