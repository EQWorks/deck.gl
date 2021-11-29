import { LayerManager, MapView, DeckRenderer } from 'kepler-outdated-deck.gl-core';
import { makeSpy } from '@probe.gl/test-utils';
import gl from './utils/setup-gl';
var testViewport = new MapView().makeViewport({
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
  var error = null;

  try {
    func();
  } catch (e) {
    error = e;
  }

  onError(error, title);
}

export function testInitializeLayer(_ref) {
  var layer = _ref.layer,
      _ref$viewport = _ref.viewport,
      viewport = _ref$viewport === void 0 ? testViewport : _ref$viewport,
      _ref$onError = _ref.onError,
      onError = _ref$onError === void 0 ? defaultOnError : _ref$onError;
  var layerManager = new LayerManager(gl, {
    viewport: viewport
  });
  safelyCall("initializing ".concat(layer.id), function () {
    return layerManager.setLayers([layer]);
  }, onError);
  return null;
}
export function testUpdateLayer(_ref2) {
  var layer = _ref2.layer,
      _ref2$viewport = _ref2.viewport,
      viewport = _ref2$viewport === void 0 ? testViewport : _ref2$viewport,
      newProps = _ref2.newProps,
      _ref2$onError = _ref2.onError,
      onError = _ref2$onError === void 0 ? defaultOnError : _ref2$onError;
  var layerManager = new LayerManager(gl, {
    viewport: viewport
  });
  safelyCall("updating ".concat(layer.id), function () {
    layerManager.setLayers([layer]);
    layerManager.setLayers([layer.clone(newProps)]);
  }, onError);
  return null;
}
export function testDrawLayer(_ref3) {
  var layer = _ref3.layer,
      _ref3$viewport = _ref3.viewport,
      viewport = _ref3$viewport === void 0 ? testViewport : _ref3$viewport,
      _ref3$uniforms = _ref3.uniforms,
      uniforms = _ref3$uniforms === void 0 ? {} : _ref3$uniforms,
      _ref3$onError = _ref3.onError,
      onError = _ref3$onError === void 0 ? defaultOnError : _ref3$onError;
  var layerManager = new LayerManager(gl, {
    viewport: viewport
  });
  var deckRenderer = new DeckRenderer(gl);
  safelyCall("drawing ".concat(layer.id), function () {
    layerManager.setLayers([layer]);
    deckRenderer.renderLayers({
      viewports: [testViewport],
      layers: layerManager.getLayers(),
      activateViewport: layerManager.activateViewport
    });
  }, onError);
  return null;
}
export function testLayer(_ref4) {
  var Layer = _ref4.Layer,
      _ref4$viewport = _ref4.viewport,
      viewport = _ref4$viewport === void 0 ? testViewport : _ref4$viewport,
      _ref4$testCases = _ref4.testCases,
      testCases = _ref4$testCases === void 0 ? [] : _ref4$testCases,
      _ref4$spies = _ref4.spies,
      spies = _ref4$spies === void 0 ? [] : _ref4$spies,
      _ref4$onError = _ref4.onError,
      onError = _ref4$onError === void 0 ? defaultOnError : _ref4$onError;
  var layerManager = new LayerManager(gl, {
    viewport: viewport
  });
  var deckRenderer = new DeckRenderer(gl);
  var initialProps = testCases[0].props;
  var layer = new Layer(initialProps);
  var oldResourceCounts = getResourceCounts();
  safelyCall("initializing ".concat(layer.id), function () {
    return layerManager.setLayers([layer]);
  }, onError);
  runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError);
  safelyCall("finalizing ".concat(layer.id), function () {
    return layerManager.setLayers([]);
  }, onError);
  var resourceCounts = getResourceCounts();

  for (var resourceName in resourceCounts) {
    if (resourceCounts[resourceName] !== oldResourceCounts[resourceName]) {
      onError(new Error("".concat(resourceCounts[resourceName] - oldResourceCounts[resourceName], " ").concat(resourceName, "s")), "".concat(layer.id, " should delete all ").concat(resourceName, "s"));
    }
  }
}

function getResourceCounts() {
  var resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

function injectSpies(layer, spies) {
  var spyMap = {};

  if (spies) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = spies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var functionName = _step.value;
        spyMap[functionName] = makeSpy(Object.getPrototypeOf(layer), functionName);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return spyMap;
}

function runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError) {
  var combinedProps = {};

  var _loop = function _loop(i) {
    var testCase = testCases[i];
    var props = testCase.props,
        updateProps = testCase.updateProps,
        onBeforeUpdate = testCase.onBeforeUpdate,
        onAfterUpdate = testCase.onAfterUpdate;
    spies = testCase.spies || spies;

    if (props) {
      combinedProps = Object.assign({}, props);
    }

    if (updateProps) {
      Object.assign(combinedProps, updateProps);
    }

    var oldState = Object.assign({}, layer.state);

    if (onBeforeUpdate) {
      onBeforeUpdate({
        layer: layer,
        testCase: testCase
      });
    }

    layer = layer.clone(combinedProps);
    var spyMap = injectSpies(layer, spies);
    safelyCall("updating ".concat(layer.id), function () {
      return layerManager.setLayers([layer]);
    }, onError);
    safelyCall("drawing ".concat(layer.id), function () {
      return deckRenderer.renderLayers({
        viewports: [testViewport],
        layers: layerManager.getLayers(),
        activateViewport: layerManager.activateViewport
      });
    }, onError);
    var subLayers = layer.isComposite ? layer.getSubLayers() : [];
    var subLayer = subLayers.length && subLayers[0];

    if (onAfterUpdate) {
      onAfterUpdate({
        testCase: testCase,
        layer: layer,
        oldState: oldState,
        subLayers: subLayers,
        subLayer: subLayer,
        spies: spyMap
      });
    }

    Object.keys(spyMap).forEach(function (k) {
      return spyMap[k].reset();
    });
  };

  for (var i = 0; i < testCases.length; i++) {
    _loop(i);
  }
}
//# sourceMappingURL=lifecycle-test.js.map