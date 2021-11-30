import { global } from '../utils/globals';
import log from '../utils/log';
import { initializeShaderModules } from '../shaderlib';
const version = typeof "7.1.1" !== 'undefined' ? "7.1.1" : global.keplerDeck_VERSION || 'untranspiled source';
const STARTUP_MESSAGE = 'set deck.log.priority=1 (or higher) to trace attribute updates';

if (global.keplerDeck && global.keplerDeck.VERSION !== version) {
  throw new Error("deck.gl - multiple versions detected: ".concat(global.keplerDeck.VERSION, " vs ").concat(version));
}

if (!global.keplerDeck) {
  log.log(0, "deck.gl ".concat(version, " - ").concat(STARTUP_MESSAGE))();
  global.keplerDeck = global.keplerDeck || {
    VERSION: version,
    version,
    log
  };
  initializeShaderModules();
}
//# sourceMappingURL=init.js.map