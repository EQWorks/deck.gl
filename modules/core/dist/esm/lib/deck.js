import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import LayerManager from './layer-manager';
import ViewManager from './view-manager';
import MapView from '../views/map-view';
import EffectManager from './effect-manager';
import Effect from './effect';
import DeckRenderer from './deck-renderer';
import DeckPicker from './deck-picker';
import log from '../utils/log';
import { AnimationLoop, createGLContext, trackContextState, setParameters, lumaStats } from '@luma.gl/core';
import { Stats } from 'probe.gl';
import { EventManager } from 'mjolnir.js';
import assert from '../utils/assert';
import { EVENTS } from './constants';

function noop() {}

var getCursor = function getCursor(_ref) {
  var isDragging = _ref.isDragging;
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
    effects: PropTypes.arrayOf(PropTypes.instanceOf(Effect)),
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

var defaultProps = {
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
  getCursor: getCursor,
  debug: false,
  drawPickingColors: false
};

var Deck = function () {
  function Deck(props) {
    _classCallCheck(this, Deck);

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
    this.stats = new Stats({
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

  _createClass(Deck, [{
    key: "finalize",
    value: function finalize() {
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
  }, {
    key: "setProps",
    value: function setProps(props) {
      this.stats.get('setProps Time').timeStart();

      if ('onLayerHover' in props) {
        log.removed('onLayerHover', 'onHover')();
      }

      if ('onLayerClick' in props) {
        log.removed('onLayerClick', 'onClick')();
      }

      props = Object.assign({}, this.props, props);
      this.props = props;

      this._setCanvasSize(props);

      var newProps = Object.assign({}, props, {
        views: this._getViews(this.props),
        width: this.width,
        height: this.height
      });

      var viewState = this._getViewState(props);

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
  }, {
    key: "needsRedraw",
    value: function needsRedraw() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        clearRedrawFlags: false
      };

      if (this.props._animate) {
        return 'Deck._animate';
      }

      var redraw = this._needsRedraw;

      if (opts.clearRedrawFlags) {
        this._needsRedraw = false;
      }

      var viewManagerNeedsRedraw = this.viewManager.needsRedraw(opts);
      var layerManagerNeedsRedraw = this.layerManager.needsRedraw(opts);
      var effectManagerNeedsRedraw = this.effectManager.needsRedraw(opts);
      var deckRendererNeedsRedraw = this.deckRenderer.needsRedraw(opts);
      redraw = redraw || viewManagerNeedsRedraw || layerManagerNeedsRedraw || effectManagerNeedsRedraw || deckRendererNeedsRedraw;
      return redraw;
    }
  }, {
    key: "redraw",
    value: function redraw(force) {
      if (!this.layerManager) {
        return;
      }

      var redrawReason = force || this.needsRedraw({
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
  }, {
    key: "getViews",
    value: function getViews() {
      return this.viewManager.views;
    }
  }, {
    key: "getViewports",
    value: function getViewports(rect) {
      return this.viewManager.getViewports(rect);
    }
  }, {
    key: "pickObject",
    value: function pickObject(_ref2) {
      var x = _ref2.x,
          y = _ref2.y,
          _ref2$radius = _ref2.radius,
          radius = _ref2$radius === void 0 ? 0 : _ref2$radius,
          _ref2$layerIds = _ref2.layerIds,
          layerIds = _ref2$layerIds === void 0 ? null : _ref2$layerIds;
      this.stats.get('Pick Count').incrementCount();
      this.stats.get('pickObject Time').timeStart();
      var layers = this.layerManager.getLayers({
        layerIds: layerIds
      });
      var activateViewport = this.layerManager.activateViewport;
      var selectedInfos = this.deckPicker.pickObject({
        x: x,
        y: y,
        radius: radius,
        layers: layers,
        viewports: this.getViewports({
          x: x,
          y: y
        }),
        activateViewport: activateViewport,
        mode: 'query',
        depth: 1
      }).result;
      this.stats.get('pickObject Time').timeEnd();
      return selectedInfos.length ? selectedInfos[0] : null;
    }
  }, {
    key: "pickMultipleObjects",
    value: function pickMultipleObjects(_ref3) {
      var x = _ref3.x,
          y = _ref3.y,
          _ref3$radius = _ref3.radius,
          radius = _ref3$radius === void 0 ? 0 : _ref3$radius,
          _ref3$layerIds = _ref3.layerIds,
          layerIds = _ref3$layerIds === void 0 ? null : _ref3$layerIds,
          _ref3$depth = _ref3.depth,
          depth = _ref3$depth === void 0 ? 10 : _ref3$depth;
      this.stats.get('Pick Count').incrementCount();
      this.stats.get('pickMultipleObjects Time').timeStart();
      var layers = this.layerManager.getLayers({
        layerIds: layerIds
      });
      var activateViewport = this.layerManager.activateViewport;
      var selectedInfos = this.deckPicker.pickObject({
        x: x,
        y: y,
        radius: radius,
        layers: layers,
        viewports: this.getViewports({
          x: x,
          y: y
        }),
        activateViewport: activateViewport,
        mode: 'query',
        depth: depth
      }).result;
      this.stats.get('pickMultipleObjects Time').timeEnd();
      return selectedInfos;
    }
  }, {
    key: "pickObjects",
    value: function pickObjects(_ref4) {
      var x = _ref4.x,
          y = _ref4.y,
          _ref4$width = _ref4.width,
          width = _ref4$width === void 0 ? 1 : _ref4$width,
          _ref4$height = _ref4.height,
          height = _ref4$height === void 0 ? 1 : _ref4$height,
          _ref4$layerIds = _ref4.layerIds,
          layerIds = _ref4$layerIds === void 0 ? null : _ref4$layerIds;
      this.stats.get('Pick Count').incrementCount();
      this.stats.get('pickObjects Time').timeStart();
      var layers = this.layerManager.getLayers({
        layerIds: layerIds
      });
      var activateViewport = this.layerManager.activateViewport;
      var infos = this.deckPicker.pickObjects({
        x: x,
        y: y,
        width: width,
        height: height,
        layers: layers,
        viewports: this.getViewports({
          x: x,
          y: y,
          width: width,
          height: height
        }),
        activateViewport: activateViewport
      });
      this.stats.get('pickObjects Time').timeEnd();
      return infos;
    }
  }, {
    key: "_createCanvas",
    value: function _createCanvas(props) {
      var canvas = props.canvas;

      if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
        assert(canvas);
      }

      if (!canvas) {
        canvas = document.createElement('canvas');
        var parent = props.parent || document.body;
        parent.appendChild(canvas);
      }

      var id = props.id,
          style = props.style;
      canvas.id = id;
      Object.assign(canvas.style, style);
      return canvas;
    }
  }, {
    key: "_setCanvasSize",
    value: function _setCanvasSize(props) {
      if (!this.canvas) {
        return;
      }

      var width = props.width,
          height = props.height;

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
  }, {
    key: "_updateCanvasSize",
    value: function _updateCanvasSize() {
      if (this._checkForCanvasSizeChange()) {
        var width = this.width,
            height = this.height;
        this.viewManager.setProps({
          width: width,
          height: height
        });
        this.props.onResize({
          width: this.width,
          height: this.height
        });
      }
    }
  }, {
    key: "_checkForCanvasSizeChange",
    value: function _checkForCanvasSizeChange() {
      var canvas = this.canvas;

      if (!canvas) {
        return false;
      }

      var newWidth = canvas.clientWidth || canvas.width;
      var newHeight = canvas.clientHeight || canvas.height;

      if (newWidth !== this.width || newHeight !== this.height) {
        this.width = newWidth;
        this.height = newHeight;
        return true;
      }

      return false;
    }
  }, {
    key: "_createAnimationLoop",
    value: function _createAnimationLoop(props) {
      var _this = this;

      var width = props.width,
          height = props.height,
          gl = props.gl,
          glOptions = props.glOptions,
          debug = props.debug,
          useDevicePixels = props.useDevicePixels,
          autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
      return new AnimationLoop({
        width: width,
        height: height,
        useDevicePixels: useDevicePixels,
        autoResizeDrawingBuffer: autoResizeDrawingBuffer,
        gl: gl,
        onCreateContext: function onCreateContext(opts) {
          return createGLContext(Object.assign({}, glOptions, opts, {
            canvas: _this.canvas,
            debug: debug
          }));
        },
        onInitialize: this._onRendererInitialized,
        onRender: this._onRenderFrame,
        onBeforeRender: props.onBeforeRender,
        onAfterRender: props.onAfterRender
      });
    }
  }, {
    key: "_getViewState",
    value: function _getViewState(props) {
      return props.viewState || this.viewState;
    }
  }, {
    key: "_getViews",
    value: function _getViews(props) {
      var views = props.views || [new MapView({
        id: 'default-view'
      })];
      views = Array.isArray(views) ? views : [views];

      if (views.length && props.controller) {
        views[0].props.controller = props.controller;
      }

      return views;
    }
  }, {
    key: "_requestPick",
    value: function _requestPick(_ref5) {
      var event = _ref5.event,
          callback = _ref5.callback,
          mode = _ref5.mode;
      var _pickRequest = this._pickRequest;

      if (event.type === 'pointerleave') {
        _pickRequest.x = -1;
        _pickRequest.y = -1;
        _pickRequest.radius = 0;
      } else {
        var pos = event.offsetCenter;

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
  }, {
    key: "_pickAndCallback",
    value: function _pickAndCallback() {
      var _pickRequest = this._pickRequest;

      if (_pickRequest.mode) {
        var _this$deckPicker$pick = this.deckPicker.pickObject(Object.assign({
          layers: this.layerManager.getLayers(),
          viewports: this.getViewports(_pickRequest),
          activateViewport: this.layerManager.activateViewport,
          depth: 1
        }, _pickRequest)),
            result = _this$deckPicker$pick.result,
            emptyInfo = _this$deckPicker$pick.emptyInfo;

        if (_pickRequest.callback) {
          var pickedInfo = result.find(function (info) {
            return info.index >= 0;
          }) || emptyInfo;

          _pickRequest.callback(pickedInfo, _pickRequest.event);
        }

        _pickRequest.mode = null;
      }
    }
  }, {
    key: "_updateCursor",
    value: function _updateCursor() {
      if (this.canvas) {
        this.canvas.style.cursor = this.props.getCursor(this.interactiveState);
      }
    }
  }, {
    key: "_updateAnimationProps",
    value: function _updateAnimationProps(animationProps) {
      this.layerManager.context.animationProps = animationProps;
    }
  }, {
    key: "_setGLContext",
    value: function _setGLContext(gl) {
      if (this.layerManager) {
        return;
      }

      if (!this.canvas) {
        this.canvas = gl.canvas;
        trackContextState(gl, {
          enable: true,
          copyState: true
        });
      }

      setParameters(gl, {
        blend: true,
        blendFunc: [770, 771, 1, 771],
        polygonOffsetFill: true,
        depthTest: true,
        depthFunc: 515
      });
      this.props.onWebGLInitialized(gl);
      this.eventManager = new EventManager(gl.canvas, {
        events: {
          pointerdown: this._onPointerDown,
          pointermove: this._onPointerMove,
          pointerleave: this._onPointerLeave
        }
      });

      for (var eventType in EVENTS) {
        this.eventManager.on(eventType, this._onEvent);
      }

      this.viewManager = new ViewManager({
        eventManager: this.eventManager,
        onViewStateChange: this._onViewStateChange,
        onInteractiveStateChange: this._onInteractiveStateChange,
        views: this._getViews(this.props),
        viewState: this._getViewState(this.props),
        width: this.width,
        height: this.height
      });
      assert(this.viewManager);
      var viewport = this.viewManager.getViewports()[0];
      this.layerManager = new LayerManager(gl, {
        deck: this,
        stats: this.stats,
        viewport: viewport
      });
      this.effectManager = new EffectManager();
      this.deckRenderer = new DeckRenderer(gl);
      this.deckPicker = new DeckPicker(gl);
      this.setProps(this.props);

      this._updateCanvasSize();

      this.props.onLoad();
    }
  }, {
    key: "_drawLayers",
    value: function _drawLayers(redrawReason, renderOptions) {
      var gl = this.layerManager.context.gl;
      setParameters(gl, this.props.parameters);
      this.props.onBeforeRender({
        gl: gl
      });
      var layers = this.layerManager.getLayers();
      var activateViewport = this.layerManager.activateViewport;
      this.deckRenderer.renderLayers(Object.assign({
        layers: layers,
        viewports: this.viewManager.getViewports(),
        activateViewport: activateViewport,
        views: this.viewManager.getViews(),
        pass: 'screen',
        redrawReason: redrawReason,
        effects: this.effectManager.getEffects()
      }, renderOptions));
      this.props.onAfterRender({
        gl: gl
      });
    }
  }, {
    key: "_onRendererInitialized",
    value: function _onRendererInitialized(_ref6) {
      var gl = _ref6.gl;

      this._setGLContext(gl);
    }
  }, {
    key: "_onRenderFrame",
    value: function _onRenderFrame(animationProps) {
      this._getFrameStats();

      if (this._metricsCounter++ % 60 === 0) {
        this._getMetrics();

        this.stats.reset();
        log.table(3, this.metrics)();

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
  }, {
    key: "_onViewStateChange",
    value: function _onViewStateChange(params) {
      var viewState = this.props.onViewStateChange(params) || params.viewState;

      if (this.viewState) {
        this.viewState[params.viewId] = viewState;
        this.viewManager.setProps({
          viewState: viewState
        });
      }
    }
  }, {
    key: "_onInteractiveStateChange",
    value: function _onInteractiveStateChange(_ref7) {
      var _ref7$isDragging = _ref7.isDragging,
          isDragging = _ref7$isDragging === void 0 ? false : _ref7$isDragging;

      if (isDragging !== this.interactiveState.isDragging) {
        this.interactiveState.isDragging = isDragging;
      }
    }
  }, {
    key: "_onEvent",
    value: function _onEvent(event) {
      var eventOptions = EVENTS[event.type];
      var pos = event.offsetCenter;

      if (!eventOptions || !pos) {
        return;
      }

      var layers = this.layerManager.getLayers();
      var info = this.deckPicker.getLastPickedObject({
        x: pos.x,
        y: pos.y,
        layers: layers,
        viewports: this.getViewports(pos)
      }, this._lastPointerDownInfo);
      var layer = info.layer;
      var layerHandler = layer && (layer[eventOptions.handler] || layer.props[eventOptions.handler]);
      var rootHandler = this.props[eventOptions.handler];
      var handled = false;

      if (layerHandler) {
        handled = layerHandler.call(layer, info, event);
      }

      if (!handled && rootHandler) {
        rootHandler(info, event);
      }
    }
  }, {
    key: "_onPointerDown",
    value: function _onPointerDown(event) {
      var pos = event.offsetCenter;
      this._lastPointerDownInfo = this.pickObject({
        x: pos.x,
        y: pos.y
      });
    }
  }, {
    key: "_onPointerMove",
    value: function _onPointerMove(event) {
      if (event.leftButton || event.rightButton) {
        return;
      }

      this._requestPick({
        callback: this.props.onHover,
        event: event,
        mode: 'hover'
      });
    }
  }, {
    key: "_onPointerLeave",
    value: function _onPointerLeave(event) {
      this._requestPick({
        callback: this.props.onHover,
        event: event,
        mode: 'hover'
      });
    }
  }, {
    key: "_getFrameStats",
    value: function _getFrameStats() {
      this.stats.get('frameRate').timeEnd();
      this.stats.get('frameRate').timeStart();
      var animationLoopStats = this.animationLoop.stats;
      this.stats.get('GPU Time').addTime(animationLoopStats.get('GPU Time').lastTiming);
      this.stats.get('CPU Time').addTime(animationLoopStats.get('CPU Time').lastTiming);
    }
  }, {
    key: "_getMetrics",
    value: function _getMetrics() {
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
      var memoryStats = lumaStats.get('Memory Usage');
      this.metrics.bufferMemory = memoryStats.get('Buffer Memory').count;
      this.metrics.textureMemory = memoryStats.get('Texture Memory').count;
      this.metrics.renderbufferMemory = memoryStats.get('Renderbuffer Memory').count;
      this.metrics.gpuMemory = memoryStats.get('GPU Memory').count;
    }
  }]);

  return Deck;
}();

export { Deck as default };
Deck.getPropTypes = getPropTypes;
Deck.defaultProps = defaultProps;
//# sourceMappingURL=deck.js.map