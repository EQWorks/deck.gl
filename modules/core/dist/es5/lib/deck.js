"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _layerManager = _interopRequireDefault(require("./layer-manager"));

var _viewManager = _interopRequireDefault(require("./view-manager"));

var _mapView = _interopRequireDefault(require("../views/map-view"));

var _effectManager = _interopRequireDefault(require("./effect-manager"));

var _effect = _interopRequireDefault(require("./effect"));

var _deckRenderer = _interopRequireDefault(require("./deck-renderer"));

var _deckPicker = _interopRequireDefault(require("./deck-picker"));

var _log = _interopRequireDefault(require("../utils/log"));

var _core = require("@luma.gl/core");

var _probe = require("probe.gl");

var _mjolnir = require("mjolnir.js");

var _assert = _interopRequireDefault(require("../utils/assert"));

var _constants = require("./constants");

function noop() {}

const getCursor = _ref => {
  let {
    isDragging
  } = _ref;
  return isDragging ? 'grabbing' : 'grab';
};

function getPropTypes(PropTypes) {
  return {
    id: PropTypes.string,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    layers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    layerFilter: PropTypes.func,
    views: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    viewState: PropTypes.object,
    effects: PropTypes.arrayOf(PropTypes.instanceOf(_effect.default)),
    controller: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]),
    gl: PropTypes.object,
    glOptions: PropTypes.object,
    parameters: PropTypes.object,
    pickingRadius: PropTypes.number,
    useDevicePixels: PropTypes.bool,
    onWebGLInitialized: PropTypes.func,
    onResize: PropTypes.func,
    onViewStateChange: PropTypes.func,
    onBeforeRender: PropTypes.func,
    onAfterRender: PropTypes.func,
    onLoad: PropTypes.func,
    debug: PropTypes.bool,
    drawPickingColors: PropTypes.bool,
    _animate: PropTypes.bool
  };
}

const defaultProps = {
  id: 'deckgl-overlay',
  width: '100%',
  height: '100%',
  pickingRadius: 0,
  layerFilter: null,
  glOptions: {},
  gl: null,
  layers: [],
  effects: [],
  views: null,
  controller: null,
  useDevicePixels: true,
  _animate: false,
  onWebGLInitialized: noop,
  onResize: noop,
  onViewStateChange: noop,
  onBeforeRender: noop,
  onAfterRender: noop,
  onLoad: noop,
  _onMetrics: null,
  getCursor,
  debug: false,
  drawPickingColors: false
};

class Deck {
  constructor(props) {
    props = Object.assign({}, defaultProps, props);
    this.width = 0;
    this.height = 0;
    this.viewManager = null;
    this.layerManager = null;
    this.effectManager = null;
    this.deckRenderer = null;
    this.deckPicker = null;
    this._needsRedraw = true;
    this._pickRequest = {};
    this._lastPointerDownInfo = null;
    this.viewState = props.initialViewState || null;
    this.interactiveState = {
      isDragging: false
    };
    this._onEvent = this._onEvent.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._pickAndCallback = this._pickAndCallback.bind(this);
    this._onRendererInitialized = this._onRendererInitialized.bind(this);
    this._onRenderFrame = this._onRenderFrame.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._onInteractiveStateChange = this._onInteractiveStateChange.bind(this);

    if (!props.gl) {
      if (typeof document !== 'undefined') {
        this.canvas = this._createCanvas(props);
      }
    }

    this.animationLoop = this._createAnimationLoop(props);
    this.stats = new _probe.Stats({
      id: 'deck.gl'
    });
    this.metrics = {
      fps: 0,
      setPropsTime: 0,
      updateAttributesTime: 0,
      framesRedrawn: 0,
      pickTime: 0,
      pickCount: 0,
      gpuTime: 0,
      gpuTimePerFrame: 0,
      cpuTime: 0,
      cpuTimePerFrame: 0,
      bufferMemory: 0,
      textureMemory: 0,
      renderbufferMemory: 0,
      gpuMemory: 0
    };
    this._metricsCounter = 0;
    this.setProps(props);
    this.animationLoop.start();
  }

  finalize() {
    this.animationLoop.stop();
    this.animationLoop = null;
    this._lastPointerDownInfo = null;

    if (this.layerManager) {
      this.layerManager.finalize();
      this.layerManager = null;
    }

    if (this.viewManager) {
      this.viewManager.finalize();
      this.viewManager = null;
    }

    if (this.effectManager) {
      this.effectManager.finalize();
      this.effectManager = null;
    }

    if (this.deckRenderer) {
      this.deckRenderer.finalize();
      this.deckRenderer = null;
    }

    if (this.eventManager) {
      this.eventManager.destroy();
    }

    if (!this.props.canvas && !this.props.gl && this.canvas) {
      this.canvas.parentElement.removeChild(this.canvas);
      this.canvas = null;
    }
  }

  setProps(props) {
    this.stats.get('setProps Time').timeStart();

    if ('onLayerHover' in props) {
      _log.default.removed('onLayerHover', 'onHover')();
    }

    if ('onLayerClick' in props) {
      _log.default.removed('onLayerClick', 'onClick')();
    }

    props = Object.assign({}, this.props, props);
    this.props = props;

    this._setCanvasSize(props);

    const newProps = Object.assign({}, props, {
      views: this._getViews(this.props),
      width: this.width,
      height: this.height
    });

    const viewState = this._getViewState(props);

    if (viewState) {
      newProps.viewState = viewState;
    }

    if (this.viewManager) {
      this.viewManager.setProps(newProps);
    }

    if (this.layerManager) {
      this.layerManager.setProps(newProps);
    }

    if (this.effectManager) {
      this.effectManager.setProps(newProps);
    }

    if (this.animationLoop) {
      this.animationLoop.setProps(newProps);
    }

    if (this.deckRenderer) {
      this.deckRenderer.setProps(newProps);
    }

    if (this.deckPicker) {
      this.deckPicker.setProps(newProps);
    }

    this.stats.get('setProps Time').timeEnd();
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };

    if (this.props._animate) {
      return 'Deck._animate';
    }

    let redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    const viewManagerNeedsRedraw = this.viewManager.needsRedraw(opts);
    const layerManagerNeedsRedraw = this.layerManager.needsRedraw(opts);
    const effectManagerNeedsRedraw = this.effectManager.needsRedraw(opts);
    const deckRendererNeedsRedraw = this.deckRenderer.needsRedraw(opts);
    redraw = redraw || viewManagerNeedsRedraw || layerManagerNeedsRedraw || effectManagerNeedsRedraw || deckRendererNeedsRedraw;
    return redraw;
  }

  redraw(force) {
    if (!this.layerManager) {
      return;
    }

    const redrawReason = force || this.needsRedraw({
      clearRedrawFlags: true
    });

    if (!redrawReason) {
      return;
    }

    this.stats.get('Redraw Count').incrementCount();

    if (this.props._customRender) {
      this.props._customRender(redrawReason);
    } else {
      this._drawLayers(redrawReason);
    }
  }

  getViews() {
    return this.viewManager.views;
  }

  getViewports(rect) {
    return this.viewManager.getViewports(rect);
  }

  pickObject(_ref2) {
    let {
      x,
      y,
      radius = 0,
      layerIds = null
    } = _ref2;
    this.stats.get('Pick Count').incrementCount();
    this.stats.get('pickObject Time').timeStart();
    const layers = this.layerManager.getLayers({
      layerIds
    });
    const activateViewport = this.layerManager.activateViewport;
    const selectedInfos = this.deckPicker.pickObject({
      x,
      y,
      radius,
      layers,
      viewports: this.getViewports({
        x,
        y
      }),
      activateViewport,
      mode: 'query',
      depth: 1
    }).result;
    this.stats.get('pickObject Time').timeEnd();
    return selectedInfos.length ? selectedInfos[0] : null;
  }

  pickMultipleObjects(_ref3) {
    let {
      x,
      y,
      radius = 0,
      layerIds = null,
      depth = 10
    } = _ref3;
    this.stats.get('Pick Count').incrementCount();
    this.stats.get('pickMultipleObjects Time').timeStart();
    const layers = this.layerManager.getLayers({
      layerIds
    });
    const activateViewport = this.layerManager.activateViewport;
    const selectedInfos = this.deckPicker.pickObject({
      x,
      y,
      radius,
      layers,
      viewports: this.getViewports({
        x,
        y
      }),
      activateViewport,
      mode: 'query',
      depth
    }).result;
    this.stats.get('pickMultipleObjects Time').timeEnd();
    return selectedInfos;
  }

  pickObjects(_ref4) {
    let {
      x,
      y,
      width = 1,
      height = 1,
      layerIds = null
    } = _ref4;
    this.stats.get('Pick Count').incrementCount();
    this.stats.get('pickObjects Time').timeStart();
    const layers = this.layerManager.getLayers({
      layerIds
    });
    const activateViewport = this.layerManager.activateViewport;
    const infos = this.deckPicker.pickObjects({
      x,
      y,
      width,
      height,
      layers,
      viewports: this.getViewports({
        x,
        y,
        width,
        height
      }),
      activateViewport
    });
    this.stats.get('pickObjects Time').timeEnd();
    return infos;
  }

  _createCanvas(props) {
    let canvas = props.canvas;

    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
      (0, _assert.default)(canvas);
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      const parent = props.parent || document.body;
      parent.appendChild(canvas);
    }

    const {
      id,
      style
    } = props;
    canvas.id = id;
    Object.assign(canvas.style, style);
    return canvas;
  }

  _setCanvasSize(props) {
    if (!this.canvas) {
      return;
    }

    let {
      width,
      height
    } = props;

    if (width || width === 0) {
      width = Number.isFinite(width) ? "".concat(width, "px") : width;
      this.canvas.style.width = width;
    }

    if (height || height === 0) {
      height = Number.isFinite(height) ? "".concat(height, "px") : height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.height = height;
    }
  }

  _updateCanvasSize() {
    if (this._checkForCanvasSizeChange()) {
      const {
        width,
        height
      } = this;
      this.viewManager.setProps({
        width,
        height
      });
      this.props.onResize({
        width: this.width,
        height: this.height
      });
    }
  }

  _checkForCanvasSizeChange() {
    const {
      canvas
    } = this;

    if (!canvas) {
      return false;
    }

    const newWidth = canvas.clientWidth || canvas.width;
    const newHeight = canvas.clientHeight || canvas.height;

    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;
      return true;
    }

    return false;
  }

  _createAnimationLoop(props) {
    const {
      width,
      height,
      gl,
      glOptions,
      debug,
      useDevicePixels,
      autoResizeDrawingBuffer
    } = props;
    return new _core.AnimationLoop({
      width,
      height,
      useDevicePixels,
      autoResizeDrawingBuffer,
      gl,
      onCreateContext: opts => (0, _core.createGLContext)(Object.assign({}, glOptions, opts, {
        canvas: this.canvas,
        debug
      })),
      onInitialize: this._onRendererInitialized,
      onRender: this._onRenderFrame,
      onBeforeRender: props.onBeforeRender,
      onAfterRender: props.onAfterRender
    });
  }

  _getViewState(props) {
    return props.viewState || this.viewState;
  }

  _getViews(props) {
    let views = props.views || [new _mapView.default({
      id: 'default-view'
    })];
    views = Array.isArray(views) ? views : [views];

    if (views.length && props.controller) {
      views[0].props.controller = props.controller;
    }

    return views;
  }

  _requestPick(_ref5) {
    let {
      event,
      callback,
      mode
    } = _ref5;
    const {
      _pickRequest
    } = this;

    if (event.type === 'pointerleave') {
      _pickRequest.x = -1;
      _pickRequest.y = -1;
      _pickRequest.radius = 0;
    } else {
      const pos = event.offsetCenter;

      if (!pos) {
        return;
      }

      _pickRequest.x = pos.x;
      _pickRequest.y = pos.y;
      _pickRequest.radius = this.props.pickingRadius;
    }

    _pickRequest.callback = callback;
    _pickRequest.event = event;
    _pickRequest.mode = mode;
  }

  _pickAndCallback() {
    const {
      _pickRequest
    } = this;

    if (_pickRequest.mode) {
      const {
        result,
        emptyInfo
      } = this.deckPicker.pickObject(Object.assign({
        layers: this.layerManager.getLayers(),
        viewports: this.getViewports(_pickRequest),
        activateViewport: this.layerManager.activateViewport,
        depth: 1
      }, _pickRequest));

      if (_pickRequest.callback) {
        const pickedInfo = result.find(info => info.index >= 0) || emptyInfo;

        _pickRequest.callback(pickedInfo, _pickRequest.event);
      }

      _pickRequest.mode = null;
    }
  }

  _updateCursor() {
    if (this.canvas) {
      this.canvas.style.cursor = this.props.getCursor(this.interactiveState);
    }
  }

  _updateAnimationProps(animationProps) {
    this.layerManager.context.animationProps = animationProps;
  }

  _setGLContext(gl) {
    if (this.layerManager) {
      return;
    }

    if (!this.canvas) {
      this.canvas = gl.canvas;
      (0, _core.trackContextState)(gl, {
        enable: true,
        copyState: true
      });
    }

    (0, _core.setParameters)(gl, {
      blend: true,
      blendFunc: [770, 771, 1, 771],
      polygonOffsetFill: true,
      depthTest: true,
      depthFunc: 515
    });
    this.props.onWebGLInitialized(gl);
    this.eventManager = new _mjolnir.EventManager(gl.canvas, {
      events: {
        pointerdown: this._onPointerDown,
        pointermove: this._onPointerMove,
        pointerleave: this._onPointerLeave
      }
    });

    for (const eventType in _constants.EVENTS) {
      this.eventManager.on(eventType, this._onEvent);
    }

    this.viewManager = new _viewManager.default({
      eventManager: this.eventManager,
      onViewStateChange: this._onViewStateChange,
      onInteractiveStateChange: this._onInteractiveStateChange,
      views: this._getViews(this.props),
      viewState: this._getViewState(this.props),
      width: this.width,
      height: this.height
    });
    (0, _assert.default)(this.viewManager);
    const viewport = this.viewManager.getViewports()[0];
    this.layerManager = new _layerManager.default(gl, {
      deck: this,
      stats: this.stats,
      viewport
    });
    this.effectManager = new _effectManager.default();
    this.deckRenderer = new _deckRenderer.default(gl);
    this.deckPicker = new _deckPicker.default(gl);
    this.setProps(this.props);

    this._updateCanvasSize();

    this.props.onLoad();
  }

  _drawLayers(redrawReason, renderOptions) {
    const {
      gl
    } = this.layerManager.context;
    (0, _core.setParameters)(gl, this.props.parameters);
    this.props.onBeforeRender({
      gl
    });
    const layers = this.layerManager.getLayers();
    const activateViewport = this.layerManager.activateViewport;
    this.deckRenderer.renderLayers(Object.assign({
      layers,
      viewports: this.viewManager.getViewports(),
      activateViewport,
      views: this.viewManager.getViews(),
      pass: 'screen',
      redrawReason,
      effects: this.effectManager.getEffects()
    }, renderOptions));
    this.props.onAfterRender({
      gl
    });
  }

  _onRendererInitialized(_ref6) {
    let {
      gl
    } = _ref6;

    this._setGLContext(gl);
  }

  _onRenderFrame(animationProps) {
    this._getFrameStats();

    if (this._metricsCounter++ % 60 === 0) {
      this._getMetrics();

      this.stats.reset();

      _log.default.table(3, this.metrics)();

      if (this.props._onMetrics) {
        this.props._onMetrics(this.metrics);
      }
    }

    this._updateCanvasSize();

    this._updateCursor();

    this.layerManager.updateLayers(animationProps);

    this._updateAnimationProps(animationProps);

    this._pickAndCallback();

    this.redraw(false);

    if (this.viewManager) {
      this.viewManager.updateViewStates(animationProps);
    }
  }

  _onViewStateChange(params) {
    const viewState = this.props.onViewStateChange(params) || params.viewState;

    if (this.viewState) {
      this.viewState[params.viewId] = viewState;
      this.viewManager.setProps({
        viewState
      });
    }
  }

  _onInteractiveStateChange(_ref7) {
    let {
      isDragging = false
    } = _ref7;

    if (isDragging !== this.interactiveState.isDragging) {
      this.interactiveState.isDragging = isDragging;
    }
  }

  _onEvent(event) {
    const eventOptions = _constants.EVENTS[event.type];
    const pos = event.offsetCenter;

    if (!eventOptions || !pos) {
      return;
    }

    const layers = this.layerManager.getLayers();
    const info = this.deckPicker.getLastPickedObject({
      x: pos.x,
      y: pos.y,
      layers,
      viewports: this.getViewports(pos)
    }, this._lastPointerDownInfo);
    const {
      layer
    } = info;
    const layerHandler = layer && (layer[eventOptions.handler] || layer.props[eventOptions.handler]);
    const rootHandler = this.props[eventOptions.handler];
    let handled = false;

    if (layerHandler) {
      handled = layerHandler.call(layer, info, event);
    }

    if (!handled && rootHandler) {
      rootHandler(info, event);
    }
  }

  _onPointerDown(event) {
    const pos = event.offsetCenter;
    this._lastPointerDownInfo = this.pickObject({
      x: pos.x,
      y: pos.y
    });
  }

  _onPointerMove(event) {
    if (event.leftButton || event.rightButton) {
      return;
    }

    this._requestPick({
      callback: this.props.onHover,
      event,
      mode: 'hover'
    });
  }

  _onPointerLeave(event) {
    this._requestPick({
      callback: this.props.onHover,
      event,
      mode: 'hover'
    });
  }

  _getFrameStats() {
    this.stats.get('frameRate').timeEnd();
    this.stats.get('frameRate').timeStart();
    const animationLoopStats = this.animationLoop.stats;
    this.stats.get('GPU Time').addTime(animationLoopStats.get('GPU Time').lastTiming);
    this.stats.get('CPU Time').addTime(animationLoopStats.get('CPU Time').lastTiming);
  }

  _getMetrics() {
    this.metrics.fps = this.stats.get('frameRate').getHz();
    this.metrics.setPropsTime = this.stats.get('setProps Time').time;
    this.metrics.updateAttributesTime = this.stats.get('Update Attributes').time;
    this.metrics.framesRedrawn = this.stats.get('Redraw Count').count;
    this.metrics.pickTime = this.stats.get('pickObject Time').time + this.stats.get('pickMultipleObjects Time').time + this.stats.get('pickObjects Time').time;
    this.metrics.pickCount = this.stats.get('Pick Count').count;
    this.metrics.gpuTime = this.stats.get('GPU Time').time;
    this.metrics.cpuTime = this.stats.get('CPU Time').time;
    this.metrics.gpuTimePerFrame = this.stats.get('GPU Time').getAverageTime();
    this.metrics.cpuTimePerFrame = this.stats.get('CPU Time').getAverageTime();

    const memoryStats = _core.lumaStats.get('Memory Usage');

    this.metrics.bufferMemory = memoryStats.get('Buffer Memory').count;
    this.metrics.textureMemory = memoryStats.get('Texture Memory').count;
    this.metrics.renderbufferMemory = memoryStats.get('Renderbuffer Memory').count;
    this.metrics.gpuMemory = memoryStats.get('GPU Memory').count;
  }

}

exports.default = Deck;
Deck.getPropTypes = getPropTypes;
Deck.defaultProps = defaultProps;
//# sourceMappingURL=deck.js.map