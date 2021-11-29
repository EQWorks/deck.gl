"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _base = require("@jupyter-widgets/base");

var _widget = require("./widget");

var _version = require("./version");

var EXTENSION_ID = 'deckgl-widget:plugin';
var DeckGLPlugin = {
  id: EXTENSION_ID,
  requires: [_base.IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true
};
var _default = DeckGLPlugin;
exports.default = _default;

function activateWidgetExtension(app, registry) {
  registry.registerWidget({
    name: _version.MODULE_NAME,
    version: _version.MODULE_VERSION,
    exports: {
      DeckGLModel: _widget.DeckGLModel,
      DeckGLView: _widget.DeckGLView
    }
  });
}
//# sourceMappingURL=plugin.js.map