import { hexbin } from 'd3-hexbin';
import { createIterable } from 'kepler-outdated-deck.gl-core';
export function pointToHexbin(_ref, viewport) {
  let data = _ref.data,
      radius = _ref.radius,
      getPosition = _ref.getPosition;
  const radiusInPixel = getRadiusInPixel(radius, viewport);
  const screenPoints = [];

  const _createIterable = createIterable(data),
        iterable = _createIterable.iterable,
        objectInfo = _createIterable.objectInfo;

  for (const object of iterable) {
    objectInfo.index++;
    screenPoints.push(Object.assign({
      screenCoord: viewport.projectFlat(getPosition(object, objectInfo))
    }, object));
  }

  const newHexbin = hexbin().radius(radiusInPixel).x(d => d.screenCoord[0]).y(d => d.screenCoord[1]);
  const hexagonBins = newHexbin(screenPoints);
  return {
    hexagons: hexagonBins.map((hex, index) => ({
      position: viewport.unprojectFlat([hex.x, hex.y]),
      points: hex,
      index
    }))
  };
}
export function getRadiusInPixel(radius, viewport) {
  const _viewport$getDistance = viewport.getDistanceScales(),
        pixelsPerMeter = _viewport$getDistance.pixelsPerMeter;

  return radius * pixelsPerMeter[0];
}
//# sourceMappingURL=hexagon-aggregator.js.map