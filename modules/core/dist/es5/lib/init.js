"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _globals = require("../utils/globals");

var _log = _interopRequireDefault(require("../utils/log"));

var _shaderlib = require("../shaderlib");

const version = typeof "7.1.1" !== 'undefined' ? "7.1.1" : _globals.global.DECK_VERSION || 'untranspiled source';
const STARTUP_MESSAGE = 'set deck.log.priority=1 (or higher) to trace attribute updates';

if (_globals.global.deck && _globals.global.deck.VERSION !== version) {
  throw new Error("deck.gl - multiple versions detected: ".concat(_globals.global.deck.VERSION, " vs ").concat(version));
}

if (!_globals.global.deck) {
  _log.default.log(0, "deck.gl ".concat(version, " - ").concat(STARTUP_MESSAGE))();

  _globals.global.deck = _globals.global.deck || {
    VERSION: version,
    version,
    log: _log.default
  };
  (0, _shaderlib.initializeShaderModules)();
}
//# sourceMappingURL=init.js.map