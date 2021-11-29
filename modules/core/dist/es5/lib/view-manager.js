"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("../utils/assert"));

var _deepEqual = require("../utils/deep-equal");

var _view = _interopRequireDefault(require("../views/view"));

var _viewport = _interopRequireDefault(require("../viewports/viewport"));

var _log = _interopRequireDefault(require("../utils/log"));

var _flatten = require("../utils/flatten");

var ViewManager = function () {
  function ViewManager() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, ViewManager);
    this.views = [];
    this.width = 100;
    this.height = 100;
    this.viewState = {};
    this.controllers = {};
    this._viewports = [];
    this._viewportMap = {};
    this._isUpdating = false;
    this._needsRedraw = 'Initial render';
    this._needsUpdate = true;
    this._eventManager = props.eventManager;
    this._eventCallbacks = {
      onViewStateChange: props.onViewStateChange,
      onInteractiveStateChange: props.onInteractiveStateChange
    };
    Object.seal(this);
    this.setProps(props);
  }

  (0, _createClass2.default)(ViewManager, [{
    key: "finalize",
    value: function finalize() {
      for (var key in this.controllers) {
        if (this.controllers[key]) {
          this.controllers[key].finalize();
        }
      }

      this.controllers = {};
    }
  }, {
    key: "needsRedraw",
    value: function needsRedraw() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        clearRedrawFlags: false
      };
      var redraw = this._needsRedraw;

      if (opts.clearRedrawFlags) {
        this._needsRedraw = false;
      }

      return redraw;
    }
  }, {
    key: "setNeedsUpdate",
    value: function setNeedsUpdate(reason) {
      this._needsUpdate = this._needsUpdate || reason;
      this._needsRedraw = this._needsRedraw || reason;
    }
  }, {
    key: "updateViewStates",
    value: function updateViewStates() {
      var animationProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if ('time' in animationProps) {
        for (var viewId in this.controllers) {
          var controller = this.controllers[viewId];

          if (controller) {
            controller.updateTransition(animationProps.time);
          }
        }
      }
    }
  }, {
    key: "getViewports",
    value: function getViewports(rect) {
      if (rect) {
        return this._viewports.filter(function (viewport) {
          return viewport.containsPixel(rect);
        });
      }

      return this._viewports;
    }
  }, {
    key: "getViews",
    value: function getViews() {
      var viewMap = {};
      this.views.forEach(function (view) {
        viewMap[view.id] = view;
      });
      return viewMap;
    }
  }, {
    key: "getView",
    value: function getView(viewOrViewId) {
      return typeof viewOrViewId === 'string' ? this.views.find(function (view) {
        return view.id === viewOrViewId;
      }) : viewOrViewId;
    }
  }, {
    key: "getViewState",
    value: function getViewState(viewId) {
      var view = this.getView(viewId);
      var viewState = view && this.viewState[view.getViewStateId()] || this.viewState;
      return view ? view.filterViewState(viewState) : viewState;
    }
  }, {
    key: "getViewport",
    value: function getViewport(viewId) {
      return this._viewportMap[viewId];
    }
  }, {
    key: "project",
    value: function project(xyz) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        topLeft: true
      };
      var viewports = this.getViewports();

      for (var i = viewports.length - 1; i >= 0; --i) {
        var viewport = viewports[i];

        if (viewport.contains(xyz, opts)) {
          return viewport.project(xyz, opts);
        }
      }

      return null;
    }
  }, {
    key: "unproject",
    value: function unproject(xyz, opts) {
      var viewports = this.getViewports();

      for (var i = viewports.length - 1; i >= 0; --i) {
        var viewport = viewports[i];

        if (viewport.containsPixel(xyz, opts)) {
          return viewport.unproject(xyz);
        }
      }

      return null;
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      if ('views' in props) {
        this._setViews(props.views);
      }

      if ('viewState' in props) {
        this._setViewState(props.viewState);
      }

      if ('width' in props || 'height' in props) {
        this._setSize(props.width, props.height);
      }

      if (!this._isUpdating) {
        this._update();
      }
    }
  }, {
    key: "_update",
    value: function _update() {
      this._isUpdating = true;

      if (this._needsUpdate) {
        this._needsUpdate = false;

        this._rebuildViewports();
      }

      if (this._needsUpdate) {
        this._needsUpdate = false;

        this._rebuildViewports();
      }

      this._isUpdating = false;
    }
  }, {
    key: "_setSize",
    value: function _setSize(width, height) {
      (0, _assert.default)(Number.isFinite(width) && Number.isFinite(height));

      if (width !== this.width || height !== this.height) {
        this.width = width;
        this.height = height;
        this.setNeedsUpdate('Size changed');
      }
    }
  }, {
    key: "_setViews",
    value: function _setViews(views) {
      views = (0, _flatten.flatten)(views, {
        filter: Boolean
      }).map(function (view) {
        return view instanceof _viewport.default ? new _view.default({
          viewportInstance: view
        }) : view;
      });

      var viewsChanged = this._diffViews(views, this.views);

      if (viewsChanged) {
        this.setNeedsUpdate('views changed');
      }

      this.views = views;
    }
  }, {
    key: "_setViewState",
    value: function _setViewState(viewState) {
      if (viewState) {
        var viewStateChanged = !(0, _deepEqual.deepEqual)(viewState, this.viewState);

        if (viewStateChanged) {
          this.setNeedsUpdate('viewState changed');
        }

        this.viewState = viewState;
      } else {
        _log.default.warn('setting null viewState')();
      }
    }
  }, {
    key: "_onViewStateChange",
    value: function _onViewStateChange(viewId, event) {
      event.viewId = viewId;

      this._eventCallbacks.onViewStateChange(event);
    }
  }, {
    key: "_createController",
    value: function _createController(props) {
      var Controller = props.type;
      var controller = new Controller(Object.assign({
        eventManager: this._eventManager,
        onViewStateChange: this._onViewStateChange.bind(this, props.id),
        onStateChange: this._eventCallbacks.onInteractiveStateChange
      }, props));
      return controller;
    }
  }, {
    key: "_updateController",
    value: function _updateController(view, viewState, viewport, controller) {
      if (view.controller) {
        var controllerProps = Object.assign({}, view.controller, viewState, {
          id: view.id,
          x: viewport.x,
          y: viewport.y,
          width: viewport.width,
          height: viewport.height
        });

        if (controller) {
          controller.setProps(controllerProps);
        } else {
          controller = this._createController(controllerProps);
        }

        return controller;
      }

      return null;
    }
  }, {
    key: "_rebuildViewports",
    value: function _rebuildViewports() {
      var _this = this;

      var width = this.width,
          height = this.height,
          views = this.views;
      var oldControllers = this.controllers;
      this.controllers = {};
      this._viewports = views.map(function (view) {
        var viewState = _this.getViewState(view);

        var viewport = view.makeViewport({
          width: width,
          height: height,
          viewState: viewState
        });
        _this.controllers[view.id] = _this._updateController(view, viewState, viewport, oldControllers[view.id]);
        return viewport;
      });

      for (var id in oldControllers) {
        if (oldControllers[id] && !this.controllers[id]) {
          oldControllers[id].finalize();
        }
      }

      this._buildViewportMap();
    }
  }, {
    key: "_buildViewportMap",
    value: function _buildViewportMap() {
      var _this2 = this;

      this._viewportMap = {};

      this._viewports.forEach(function (viewport) {
        if (viewport.id) {
          _this2._viewportMap[viewport.id] = _this2._viewportMap[viewport.id] || viewport;
        }
      });
    }
  }, {
    key: "_diffViews",
    value: function _diffViews(newViews, oldViews) {
      if (newViews.length !== oldViews.length) {
        return true;
      }

      return newViews.some(function (_, i) {
        return !newViews[i].equals(oldViews[i]);
      });
    }
  }]);
  return ViewManager;
}();

exports.default = ViewManager;
//# sourceMappingURL=view-manager.js.map