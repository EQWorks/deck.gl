"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testDrawLayer = testDrawLayer;
exports.testInitializeLayer = testInitializeLayer;
exports.testLayer = testLayer;
exports.testUpdateLayer = testUpdateLayer;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _testUtils = require("@probe.gl/test-utils");

var _setupGl = _interopRequireDefault(require("./utils/setup-gl"));

const testViewport = new _keplerOutdatedDeck.MapView().makeViewport({
  width: 100,
  height: 100,
  viewState: {
    longitude: 0,
    latitude: 0,
    zoom: 1
  }
});

function defaultOnError(error, title) {
  if (error) {
    throw error;
  }
}

function safelyCall(title, func, onError) {
  let error = null;

  try {
    func();
  } catch (e) {
    error = e;
  }

  onError(error, title);
}

function testInitializeLayer(_ref) {
  let {
    layer,
    viewport = testViewport,
    onError = defaultOnError
  } = _ref;
  const layerManager = new _keplerOutdatedDeck.LayerManager(_setupGl.default, {
    viewport
  });
  safelyCall("initializing ".concat(layer.id), () => layerManager.setLayers([layer]), onError);
  return null;
}

function testUpdateLayer(_ref2) {
  let {
    layer,
    viewport = testViewport,
    newProps,
    onError = defaultOnError
  } = _ref2;
  const layerManager = new _keplerOutdatedDeck.LayerManager(_setupGl.default, {
    viewport
  });
  safelyCall("updating ".concat(layer.id), () => {
    layerManager.setLayers([layer]);
    layerManager.setLayers([layer.clone(newProps)]);
  }, onError);
  return null;
}

function testDrawLayer(_ref3) {
  let {
    layer,
    viewport = testViewport,
    uniforms = {},
    onError = defaultOnError
  } = _ref3;
  const layerManager = new _keplerOutdatedDeck.LayerManager(_setupGl.default, {
    viewport
  });
  const deckRenderer = new _keplerOutdatedDeck.DeckRenderer(_setupGl.default);
  safelyCall("drawing ".concat(layer.id), () => {
    layerManager.setLayers([layer]);
    deckRenderer.renderLayers({
      viewports: [testViewport],
      layers: layerManager.getLayers(),
      activateViewport: layerManager.activateViewport
    });
  }, onError);
  return null;
}

function testLayer(_ref4) {
  let {
    Layer,
    viewport = testViewport,
    testCases = [],
    spies = [],
    onError = defaultOnError
  } = _ref4;
  const layerManager = new _keplerOutdatedDeck.LayerManager(_setupGl.default, {
    viewport
  });
  const deckRenderer = new _keplerOutdatedDeck.DeckRenderer(_setupGl.default);
  const initialProps = testCases[0].props;
  const layer = new Layer(initialProps);
  const oldResourceCounts = getResourceCounts();
  safelyCall("initializing ".concat(layer.id), () => layerManager.setLayers([layer]), onError);
  runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError);
  safelyCall("finalizing ".concat(layer.id), () => layerManager.setLayers([]), onError);
  const resourceCounts = getResourceCounts();

  for (const resourceName in resourceCounts) {
    if (resourceCounts[resourceName] !== oldResourceCounts[resourceName]) {
      onError(new Error("".concat(resourceCounts[resourceName] - oldResourceCounts[resourceName], " ").concat(resourceName, "s")), "".concat(layer.id, " should delete all ").concat(resourceName, "s"));
    }
  }
}

function getResourceCounts() {
  const resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

function injectSpies(layer, spies) {
  const spyMap = {};

  if (spies) {
    for (const functionName of spies) {
      spyMap[functionName] = (0, _testUtils.makeSpy)(Object.getPrototypeOf(layer), functionName);
    }
  }

  return spyMap;
}

function runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError) {
  let combinedProps = {};

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const {
      props,
      updateProps,
      onBeforeUpdate,
      onAfterUpdate
    } = testCase;
    spies = testCase.spies || spies;

    if (props) {
      combinedProps = Object.assign({}, props);
    }

    if (updateProps) {
      Object.assign(combinedProps, updateProps);
    }

    const oldState = Object.assign({}, layer.state);

    if (onBeforeUpdate) {
      onBeforeUpdate({
        layer,
        testCase
      });
    }

    layer = layer.clone(combinedProps);
    const spyMap = injectSpies(layer, spies);
    safelyCall("updating ".concat(layer.id), () => layerManager.setLayers([layer]), onError);
    safelyCall("drawing ".concat(layer.id), () => deckRenderer.renderLayers({
      viewports: [testViewport],
      layers: layerManager.getLayers(),
      activateViewport: layerManager.activateViewport
    }), onError);
    const subLayers = layer.isComposite ? layer.getSubLayers() : [];
    const subLayer = subLayers.length && subLayers[0];

    if (onAfterUpdate) {
      onAfterUpdate({
        testCase,
        layer,
        oldState,
        subLayers,
        subLayer,
        spies: spyMap
      });
    }

    Object.keys(spyMap).forEach(k => spyMap[k].reset());
  }
}
//# sourceMappingURL=lifecycle-test.js.map