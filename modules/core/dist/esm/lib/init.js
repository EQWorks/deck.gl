import { global } from '../utils/globals';
import log from '../utils/log';
import { initializeShaderModules } from '../shaderlib';
var version = typeof "7.1.1" !== 'undefined' ? "7.1.1" : global.DECK_VERSION || 'untranspiled source';
var STARTUP_MESSAGE = 'set deck.log.priority=1 (or higher) to trace attribute updates';

if (global.deck && global.deck.VERSION !== version) {
  throw new Error("deck.gl - multiple versions detected: ".concat(global.deck.VERSION, " vs ").concat(version));
}

if (!global.deck) {
  log.log(0, "deck.gl ".concat(version, " - ").concat(STARTUP_MESSAGE))();
  global.deck = global.deck || {
    VERSION: version,
    version: version,
    log: log
  };
  initializeShaderModules();
}
//# sourceMappingURL=init.js.map