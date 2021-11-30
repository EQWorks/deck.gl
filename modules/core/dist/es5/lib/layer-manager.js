"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("../utils/assert"));

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _seer = _interopRequireDefault(require("seer"));

var _layer = _interopRequireDefault(require("./layer"));

var _constants = require("../lifecycle/constants");

var _log = _interopRequireDefault(require("../utils/log"));

var _flatten = require("../utils/flatten");

var _probe = require("probe.gl");

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _seerIntegration = require("./seer-integration");

const LOG_PRIORITY_LIFECYCLE = 2;
const LOG_PRIORITY_LIFECYCLE_MINOR = 4;
const INITIAL_CONTEXT = Object.seal({
  layerManager: null,
  deck: null,
  gl: null,
  time: -1,
  useDevicePixels: true,
  stats: null,
  shaderCache: null,
  pickingFBO: null,
  animationProps: null,
  userData: {}
});

const layerName = layer => layer instanceof _layer.default ? "".concat(layer) : !layer ? 'null' : 'invalid';

class LayerManager {
  constructor(gl) {
    let {
      deck,
      stats,
      viewport = null
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.lastRenderedLayers = [];
    this.layers = [];
    this.context = Object.assign({}, INITIAL_CONTEXT, {
      layerManager: this,
      deck,
      gl,
      shaderCache: gl && new _keplerOutdatedLuma._ShaderCache({
        gl,
        _cachePrograms: true
      }),
      stats: stats || new _probe.Stats({
        id: 'deck.gl'
      }),
      viewport: viewport || new _viewport.default({
        id: 'DEFAULT-INITIAL-VIEWPORT'
      })
    });
    this._needsRedraw = 'Initial render';
    this._needsUpdate = false;
    this._debug = false;
    this.activateViewport = this.activateViewport.bind(this);
    this._initSeer = this._initSeer.bind(this);
    this._editSeer = this._editSeer.bind(this);
    Object.seal(this);
    (0, _seerIntegration.seerInitListener)(this._initSeer);
    (0, _seerIntegration.layerEditListener)(this._editSeer);
  }

  finalize() {
    for (const layer of this.layers) {
      this._finalizeLayer(layer);
    }

    _seer.default.removeListener(this._initSeer);

    _seer.default.removeListener(this._editSeer);
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    return this._checkIfNeedsRedraw(opts);
  }

  needsUpdate() {
    return this._needsUpdate;
  }

  setNeedsRedraw(reason) {
    this._needsRedraw = this._needsRedraw || reason;
  }

  setNeedsUpdate(reason) {
    this._needsUpdate = this._needsUpdate || reason;
  }

  getLayers() {
    let {
      layerIds = null
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return layerIds ? this.layers.filter(layer => layerIds.find(layerId => layer.id.indexOf(layerId) === 0)) : this.layers;
  }

  setProps(props) {
    if ('debug' in props) {
      this._debug = props.debug;
    }

    if ('userData' in props) {
      this.context.userData = props.userData;
    }

    if ('useDevicePixels' in props) {
      this.context.useDevicePixels = props.useDevicePixels;
    }

    if ('layers' in props) {
      this.setLayers(props.layers);
    }
  }

  setLayers(newLayers) {
    if (newLayers === this.lastRenderedLayers) {
      _log.default.log(3, 'Ignoring layer update due to layer array not changed')();

      return this;
    }

    this.lastRenderedLayers = newLayers;
    newLayers = (0, _flatten.flatten)(newLayers, {
      filter: Boolean
    });

    for (const layer of newLayers) {
      layer.context = this.context;
    }

    const {
      error,
      generatedLayers
    } = this._updateLayers({
      oldLayers: this.layers,
      newLayers
    });

    this.layers = generatedLayers;

    if (error) {
      throw error;
    }

    return this;
  }

  updateLayers() {
    let animationProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if ('time' in animationProps) {
      this.context.time = animationProps.time;
    }

    const reason = this.needsUpdate();

    if (reason) {
      this.setNeedsRedraw("updating layers: ".concat(reason));
      this.setLayers([...this.lastRenderedLayers]);
    }
  }

  _checkIfNeedsRedraw(opts) {
    let redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    for (const layer of this.layers) {
      const layerNeedsRedraw = layer.getNeedsRedraw(opts);
      redraw = redraw || layerNeedsRedraw;
    }

    return redraw;
  }

  activateViewport(viewport) {
    const oldViewport = this.context.viewport;
    const viewportChanged = !oldViewport || !viewport.equals(oldViewport);

    if (viewportChanged) {
      _log.default.log(4, 'Viewport changed', viewport)();

      this.context.viewport = viewport;

      for (const layer of this.layers) {
        layer.setChangeFlags({
          viewportChanged: 'Viewport changed'
        });

        this._updateLayer(layer);
      }
    }

    (0, _assert.default)(this.context.viewport, 'LayerManager: viewport not set');
    return this;
  }

  _updateLayers(_ref) {
    let {
      oldLayers,
      newLayers
    } = _ref;
    const oldLayerMap = {};

    for (const oldLayer of oldLayers) {
      if (oldLayerMap[oldLayer.id]) {
        _log.default.warn("Multiple old layers with same id ".concat(layerName(oldLayer)))();
      } else {
        oldLayerMap[oldLayer.id] = oldLayer;
      }
    }

    const generatedLayers = [];

    const error = this._updateSublayersRecursively({
      newLayers,
      oldLayerMap,
      generatedLayers
    });

    const error2 = this._finalizeOldLayers(oldLayerMap);

    this._needsUpdate = false;
    const firstError = error || error2;
    return {
      error: firstError,
      generatedLayers
    };
  }

  _updateSublayersRecursively(_ref2) {
    let {
      newLayers,
      oldLayerMap,
      generatedLayers
    } = _ref2;
    let error = null;

    for (const newLayer of newLayers) {
      newLayer.context = this.context;
      const oldLayer = oldLayerMap[newLayer.id];

      if (oldLayer === null) {
        _log.default.warn("Multiple new layers with same id ".concat(layerName(newLayer)))();
      }

      oldLayerMap[newLayer.id] = null;
      let sublayers = null;

      try {
        if (this._debug && oldLayer !== newLayer) {
          newLayer.validateProps();
        }

        if (!oldLayer) {
          const err = this._initializeLayer(newLayer);

          error = error || err;
          (0, _seerIntegration.initLayerInSeer)(newLayer);
        } else {
          this._transferLayerState(oldLayer, newLayer);

          const err = this._updateLayer(newLayer);

          error = error || err;
          (0, _seerIntegration.updateLayerInSeer)(newLayer);
        }

        generatedLayers.push(newLayer);
        sublayers = newLayer.isComposite && newLayer.getSubLayers();
      } catch (err) {
        _log.default.warn("error during matching of ".concat(layerName(newLayer)), err)();

        error = error || err;
      }

      if (sublayers) {
        const err = this._updateSublayersRecursively({
          newLayers: sublayers,
          oldLayerMap,
          generatedLayers
        });

        error = error || err;
      }
    }

    return error;
  }

  _finalizeOldLayers(oldLayerMap) {
    let error = null;

    for (const layerId in oldLayerMap) {
      const layer = oldLayerMap[layerId];

      if (layer) {
        error = error || this._finalizeLayer(layer);
      }
    }

    return error;
  }

  _initializeLayer(layer) {
    _log.default.log(LOG_PRIORITY_LIFECYCLE, "initializing ".concat(layerName(layer)))();

    let error = null;

    try {
      layer._initialize();

      layer.lifecycle = _constants.LIFECYCLE.INITIALIZED;
    } catch (err) {
      _log.default.warn("error while initializing ".concat(layerName(layer), "\n"), err)();

      error = error || err;
    }

    layer.internalState.layer = layer;

    for (const model of layer.getModels()) {
      model.userData.layer = layer;
    }

    return error;
  }

  _transferLayerState(oldLayer, newLayer) {
    newLayer._transferState(oldLayer);

    newLayer.lifecycle = _constants.LIFECYCLE.MATCHED;

    if (newLayer !== oldLayer) {
      _log.default.log(LOG_PRIORITY_LIFECYCLE_MINOR, "matched ".concat(layerName(newLayer)), oldLayer, '->', newLayer)();

      oldLayer.lifecycle = _constants.LIFECYCLE.AWAITING_GC;
    } else {
      _log.default.log(LOG_PRIORITY_LIFECYCLE_MINOR, "Matching layer is unchanged ".concat(newLayer.id))();
    }
  }

  _updateLayer(layer) {
    _log.default.log(LOG_PRIORITY_LIFECYCLE_MINOR, "updating ".concat(layer, " because: ").concat(layer.printChangeFlags()))();

    let error = null;

    try {
      layer._update();
    } catch (err) {
      _log.default.warn("error during update of ".concat(layerName(layer)), err)();

      error = err;
    }

    return error;
  }

  _finalizeLayer(layer) {
    (0, _assert.default)(layer.lifecycle !== _constants.LIFECYCLE.AWAITING_FINALIZATION);
    layer.lifecycle = _constants.LIFECYCLE.AWAITING_FINALIZATION;
    let error = null;
    this.setNeedsRedraw("finalized ".concat(layerName(layer)));

    try {
      layer._finalize();
    } catch (err) {
      _log.default.warn("error during finalization of ".concat(layerName(layer)), err)();

      error = err;
    }

    layer.lifecycle = _constants.LIFECYCLE.FINALIZED;

    _log.default.log(LOG_PRIORITY_LIFECYCLE, "finalizing ".concat(layerName(layer)))();

    return error;
  }

  _initSeer() {
    this.layers.forEach(layer => {
      (0, _seerIntegration.initLayerInSeer)(layer);
      (0, _seerIntegration.updateLayerInSeer)(layer);
    });
  }

  _editSeer(payload) {
    if (payload.type !== 'edit' || payload.valuePath[0] !== 'props') {
      return;
    }

    (0, _seerIntegration.setPropOverrides)(payload.itemKey, payload.valuePath.slice(1), payload.value);
    this.updateLayers();
  }

}

exports.default = LayerManager;
//# sourceMappingURL=layer-manager.js.map