const JSONUtils = require('./src');

/* global window, global */
const _global = typeof window === 'undefined' ? global : window;
const deck = _global.keplerDeck || {};

// Check if peer dependencies are included
if (!deck.Layer) {
  throw new Error('kepler-outdated-deck.gl-core is not found');
}

module.exports = Object.assign(deck, JSONUtils);
