import { LayerManager, MapView, DeckRenderer } from 'kepler-outdated-deck.gl-core';
import { makeSpy } from '@probe.gl/test-utils';
import gl from './utils/setup-gl';
const testViewport = new MapView().makeViewport({
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

export function testInitializeLayer(_ref) {
  let layer = _ref.layer,
      _ref$viewport = _ref.viewport,
      viewport = _ref$viewport === void 0 ? testViewport : _ref$viewport,
      _ref$onError = _ref.onError,
      onError = _ref$onError === void 0 ? defaultOnError : _ref$onError;
  const layerManager = new LayerManager(gl, {
    viewport
  });
  safelyCall(`initializing ${layer.id}`, () => layerManager.setLayers([layer]), onError);
  return null;
}
export function testUpdateLayer(_ref2) {
  let layer = _ref2.layer,
      _ref2$viewport = _ref2.viewport,
      viewport = _ref2$viewport === void 0 ? testViewport : _ref2$viewport,
      newProps = _ref2.newProps,
      _ref2$onError = _ref2.onError,
      onError = _ref2$onError === void 0 ? defaultOnError : _ref2$onError;
  const layerManager = new LayerManager(gl, {
    viewport
  });
  safelyCall(`updating ${layer.id}`, () => {
    layerManager.setLayers([layer]);
    layerManager.setLayers([layer.clone(newProps)]);
  }, onError);
  return null;
}
export function testDrawLayer(_ref3) {
  let layer = _ref3.layer,
      _ref3$viewport = _ref3.viewport,
      viewport = _ref3$viewport === void 0 ? testViewport : _ref3$viewport,
      _ref3$uniforms = _ref3.uniforms,
      uniforms = _ref3$uniforms === void 0 ? {} : _ref3$uniforms,
      _ref3$onError = _ref3.onError,
      onError = _ref3$onError === void 0 ? defaultOnError : _ref3$onError;
  const layerManager = new LayerManager(gl, {
    viewport
  });
  const deckRenderer = new DeckRenderer(gl);
  safelyCall(`drawing ${layer.id}`, () => {
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
  let Layer = _ref4.Layer,
      _ref4$viewport = _ref4.viewport,
      viewport = _ref4$viewport === void 0 ? testViewport : _ref4$viewport,
      _ref4$testCases = _ref4.testCases,
      testCases = _ref4$testCases === void 0 ? [] : _ref4$testCases,
      _ref4$spies = _ref4.spies,
      spies = _ref4$spies === void 0 ? [] : _ref4$spies,
      _ref4$onError = _ref4.onError,
      onError = _ref4$onError === void 0 ? defaultOnError : _ref4$onError;
  const layerManager = new LayerManager(gl, {
    viewport
  });
  const deckRenderer = new DeckRenderer(gl);
  const initialProps = testCases[0].props;
  const layer = new Layer(initialProps);
  const oldResourceCounts = getResourceCounts();
  safelyCall(`initializing ${layer.id}`, () => layerManager.setLayers([layer]), onError);
  runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError);
  safelyCall(`finalizing ${layer.id}`, () => layerManager.setLayers([]), onError);
  const resourceCounts = getResourceCounts();

  for (const resourceName in resourceCounts) {
    if (resourceCounts[resourceName] !== oldResourceCounts[resourceName]) {
      onError(new Error(`${resourceCounts[resourceName] - oldResourceCounts[resourceName]} ${resourceName}s`), `${layer.id} should delete all ${resourceName}s`);
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
      spyMap[functionName] = makeSpy(Object.getPrototypeOf(layer), functionName);
    }
  }

  return spyMap;
}

function runLayerTests(layerManager, deckRenderer, layer, testCases, spies, onError) {
  let combinedProps = {};

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const props = testCase.props,
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

    const oldState = Object.assign({}, layer.state);

    if (onBeforeUpdate) {
      onBeforeUpdate({
        layer,
        testCase
      });
    }

    layer = layer.clone(combinedProps);
    const spyMap = injectSpies(layer, spies);
    safelyCall(`updating ${layer.id}`, () => layerManager.setLayers([layer]), onError);
    safelyCall(`drawing ${layer.id}`, () => deckRenderer.renderLayers({
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