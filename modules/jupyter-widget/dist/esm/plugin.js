import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { DeckGLModel, DeckGLView } from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';
var EXTENSION_ID = 'deckgl-widget:plugin';
var DeckGLPlugin = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true
};
export default DeckGLPlugin;

function activateWidgetExtension(app, registry) {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: {
      DeckGLModel: DeckGLModel,
      DeckGLView: DeckGLView
    }
  });
}
//# sourceMappingURL=plugin.js.map