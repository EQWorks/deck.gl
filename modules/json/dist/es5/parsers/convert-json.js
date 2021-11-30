"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertTopLevelJSON = convertTopLevelJSON;
exports.getJSONLayers = getJSONLayers;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _jsonLayer = _interopRequireDefault(require("../json-layer/json-layer"));

var _get = require("../utils/get");

var _d3Dsv = require("d3-dsv");

const DEFAULT_VIEW_CATALOG = {
  MapView: _keplerOutdatedDeck.MapView,
  FirstPersonView: _keplerOutdatedDeck.FirstPersonView,
  OrbitView: _keplerOutdatedDeck.OrbitView,
  OrthographicView: _keplerOutdatedDeck.OrthographicView
};
const DEFAULT_MAP_PROPS = {
  style: 'mapbox://styles/mapbox/light-v9'
};

function convertTopLevelJSON(json, configuration) {
  const jsonProps = json;

  if (jsonProps.layers) {
    jsonProps.layers = convertJSONLayers(json.layers, configuration);
  }

  if (jsonProps.views) {
    jsonProps.views = convertJSONViews(json.views, configuration);
  }

  if ('initialViewState' in jsonProps) {
    jsonProps.viewState = jsonProps.viewState || jsonProps.initialViewState;
  }

  convertJSONMapProps(jsonProps, configuration);
  return jsonProps;
}

function convertJSONMapProps(jsonProps, configuration) {
  if (jsonProps.map || jsonProps.mapStyle) {
    jsonProps.map = Object.assign({}, DEFAULT_MAP_PROPS, jsonProps.map);
  }

  if (!jsonProps.map) {
    return;
  }

  if ('mapStyle' in jsonProps) {
    jsonProps.map.style = jsonProps.mapStyle;
    jsonProps.map.mapStyle = jsonProps.mapStyle;
    delete jsonProps.mapStyle;
  }

  if ('viewState' in jsonProps) {
    jsonProps.map.viewState = jsonProps.viewState;
  }
}

function convertJSONLayers(jsonLayers, configuration) {
  return [new _jsonLayer.default({
    data: jsonLayers,
    configuration
  })];
}

function convertJSONViews(jsonViews, configuration) {
  if (!jsonViews) {
    return jsonViews;
  }

  const viewCatalog = configuration.views || {};
  jsonViews = Array.isArray(jsonViews) ? jsonViews : [jsonViews];
  return jsonViews.map(jsonView => {
    const View = viewCatalog[jsonView.type] || DEFAULT_VIEW_CATALOG[jsonView.type];

    if (View) {
      const viewProps = Object.assign({}, jsonView);
      delete viewProps.type;
      return new View(viewProps);
    }

    return null;
  }).filter(Boolean);
}

function getJSONLayers() {
  let jsonLayers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  let configuration = arguments.length > 1 ? arguments[1] : undefined;
  const layerCatalog = configuration.layers || {};
  return jsonLayers.map(jsonLayer => {
    const Layer = layerCatalog[jsonLayer.type];
    const props = getJSONLayerProps(jsonLayer, configuration);
    props.fetch = enhancedFetch;
    return Layer && new Layer(props);
  });
}

function getJSONLayerProps(jsonProps, configuration) {
  const replacedProps = {};

  for (const propName in jsonProps) {
    const propValue = jsonProps[propName];

    if (propName.startsWith('get')) {
      replacedProps[propName] = getJSONAccessor(propValue, configuration);
    } else {
      replacedProps[propName] = propValue;
    }
  }

  return replacedProps;
}

function getJSONAccessor(propValue, configuration) {
  if (propValue === '-') {
    return object => object;
  }

  if (typeof propValue === 'string') {
    return object => {
      return (0, _get.get)(object, propValue);
    };
  }

  return propValue;
}

function enhancedFetch(url) {
  return fetch(url).then(response => response.text()).then(text => {
    try {
      return JSON.parse(text);
    } catch (error) {
      return parseCSV(text);
    }
  });
}

function parseCSV(text) {
  const csv = (0, _d3Dsv.csvParseRows)(text);

  if (csv.length > 0) {
    csv.shift();
  }

  for (const row of csv) {
    for (const key in row) {
      const number = parseFloat(row[key]) || 0;

      if (!Number.isNaN(number)) {
        row[key] = number;
      }
    }
  }

  return csv;
}
//# sourceMappingURL=convert-json.js.map