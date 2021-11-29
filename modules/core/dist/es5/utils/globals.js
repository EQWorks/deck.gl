"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.window = exports.isBrowser = exports.global = exports.document = void 0;
const isBrowser = typeof process !== 'object' || String(process) !== '[object process]' || process.browser;
exports.isBrowser = isBrowser;
const window_ = typeof window !== 'undefined' ? window : global;
exports.window = window_;
const global_ = typeof global !== 'undefined' ? global : window;
exports.global = global_;
const document_ = typeof document !== 'undefined' ? document : {};
exports.document = document_;
//# sourceMappingURL=globals.js.map