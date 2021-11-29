const deck = require('../core/bundle');

Object.assign(
  deck,
  require('kepler-outdated-deck.gl-layers'),
  require('kepler-outdated-deck.gl-aggregation-layers'),
  require('kepler-outdated-deck.gl-geo-layers'),
  require('kepler-outdated-deck.gl-google-maps'),
  require('kepler-outdated-deck.gl-mesh-layers'),
  require('kepler-outdated-deck.gl-mapbox'),
  require('kepler-outdated-deck.gl-json')
);

module.exports = deck;
