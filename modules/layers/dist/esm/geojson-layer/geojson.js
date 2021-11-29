export default function assert(condition, message) {
  if (!condition) {
    throw new Error("deck.gl: ".concat(message));
  }
}
export function getGeojsonFeatures(geojson) {
  if (Array.isArray(geojson)) {
    return geojson;
  }

  assert(geojson.type, 'GeoJSON does not have type');

  switch (geojson.type) {
    case 'Feature':
      return [geojson];

    case 'FeatureCollection':
      assert(Array.isArray(geojson.features), 'GeoJSON does not have features array');
      return geojson.features;

    default:
      return [{
        geometry: geojson
      }];
  }
}
export function separateGeojsonFeatures(features) {
  const separated = {
    pointFeatures: [],
    lineFeatures: [],
    polygonFeatures: [],
    polygonOutlineFeatures: []
  };

  for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
    const feature = features[featureIndex];
    assert(feature && feature.geometry, 'GeoJSON does not have geometry');
    const {
      geometry
    } = feature;
    const sourceFeature = {
      feature,
      index: featureIndex
    };

    if (geometry.type === 'GeometryCollection') {
      assert(Array.isArray(geometry.geometries), 'GeoJSON does not have geometries array');
      const {
        geometries
      } = geometry;

      for (let i = 0; i < geometries.length; i++) {
        const subGeometry = geometries[i];
        separateGeometry(subGeometry, separated, sourceFeature);
      }
    } else {
      separateGeometry(geometry, separated, sourceFeature);
    }
  }

  return separated;
}

function separateGeometry(geometry, separated, sourceFeature) {
  const {
    type,
    coordinates
  } = geometry;
  const {
    pointFeatures,
    lineFeatures,
    polygonFeatures,
    polygonOutlineFeatures
  } = separated;
  checkCoordinates(type, coordinates);

  switch (type) {
    case 'Point':
      pointFeatures.push({
        geometry,
        sourceFeature
      });
      break;

    case 'MultiPoint':
      coordinates.forEach(point => {
        pointFeatures.push({
          geometry: {
            type: 'Point',
            coordinates: point
          },
          sourceFeature
        });
      });
      break;

    case 'LineString':
      lineFeatures.push({
        geometry,
        sourceFeature
      });
      break;

    case 'MultiLineString':
      coordinates.forEach(path => {
        lineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: path
          },
          sourceFeature
        });
      });
      break;

    case 'Polygon':
      polygonFeatures.push({
        geometry,
        sourceFeature
      });
      coordinates.forEach(path => {
        polygonOutlineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: path
          },
          sourceFeature
        });
      });
      break;

    case 'MultiPolygon':
      coordinates.forEach(polygon => {
        polygonFeatures.push({
          geometry: {
            type: 'Polygon',
            coordinates: polygon
          },
          sourceFeature
        });
        polygon.forEach(path => {
          polygonOutlineFeatures.push({
            geometry: {
              type: 'LineString',
              coordinates: path
            },
            sourceFeature
          });
        });
      });
      break;

    default:
  }
}

export function unwrapSourceFeature(wrappedFeature) {
  return wrappedFeature.sourceFeature.feature;
}
export function unwrapSourceFeatureIndex(wrappedFeature) {
  return wrappedFeature.sourceFeature.index;
}
const COORDINATE_NEST_LEVEL = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4
};

function checkCoordinates(type, coordinates) {
  let nestLevel = COORDINATE_NEST_LEVEL[type];
  assert(nestLevel, "Unknown GeoJSON type ".concat(type));

  while (coordinates && --nestLevel > 0) {
    coordinates = coordinates[0];
  }

  assert(coordinates && Number.isFinite(coordinates[0]), "".concat(type, " coordinates are malformed"));
}
//# sourceMappingURL=geojson.js.map