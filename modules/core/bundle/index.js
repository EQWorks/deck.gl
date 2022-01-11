// We use `require` here because luma and deck core must be imported before `global`
const lumaGLCore = require('kepler-outdated-luma.gl-core');
const deckGLCore = require('../src');

const DeckGL = require('./deckgl').default;

/* global window, global */
const _global = typeof window === 'undefined' ? global : window;
_global.keplerDeck = _global.keplerDeck || {};
_global.luma = _global.luma || {};

Object.assign(_global.keplerDeck, deckGLCore, { DeckGL });
Object.assign(_global.luma, lumaGLCore);

module.exports = _global.keplerDeck;
