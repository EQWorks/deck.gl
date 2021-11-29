"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRadiusInPixel = getRadiusInPixel;
exports.pointToHexbin = pointToHexbin;

var _d3Hexbin = require("d3-hexbin");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

function pointToHexbin(_ref, viewport) {
  let {
    data,
    radius,
    getPosition
  } = _ref;
  const radiusInPixel = getRadiusInPixel(radius, viewport);
  const screenPoints = [];
  const {
    iterable,
    objectInfo
  } = (0, _keplerOutdatedDeck.createIterable)(data);

  for (const object of iterable) {
    objectInfo.index++;
    screenPoints.push(Object.assign({
      screenCoord: viewport.projectFlat(getPosition(object, objectInfo))
    }, object));
  }

  const newHexbin = (0, _d3Hexbin.hexbin)().radius(radiusInPixel).x(d => d.screenCoord[0]).y(d => d.screenCoord[1]);
  const hexagonBins = newHexbin(screenPoints);
  return {
    hexagons: hexagonBins.map((hex, index) => ({
      position: viewport.unprojectFlat([hex.x, hex.y]),
      points: hex,
      index
    }))
  };
}

function getRadiusInPixel(radius, viewport) {
  const {
    pixelsPerMeter
  } = viewport.getDistanceScales();
  return radius * pixelsPerMeter[0];
}
//# sourceMappingURL=hexagon-aggregator.js.map