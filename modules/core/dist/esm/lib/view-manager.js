import assert from '../utils/assert';
import { deepEqual } from '../utils/deep-equal';
import View from '../views/view';
import Viewport from '../viewports/viewport';
import log from '../utils/log';
import { flatten } from '../utils/flatten';
export default class ViewManager {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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

  finalize() {
    for (const key in this.controllers) {
      if (this.controllers[key]) {
        this.controllers[key].finalize();
      }
    }

    this.controllers = {};
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    return redraw;
  }

  setNeedsUpdate(reason) {
    this._needsUpdate = this._needsUpdate || reason;
    this._needsRedraw = this._needsRedraw || reason;
  }

  updateViewStates() {
    let animationProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if ('time' in animationProps) {
      for (const viewId in this.controllers) {
        const controller = this.controllers[viewId];

        if (controller) {
          controller.updateTransition(animationProps.time);
        }
      }
    }
  }

  getViewports(rect) {
    if (rect) {
      return this._viewports.filter(viewport => viewport.containsPixel(rect));
    }

    return this._viewports;
  }

  getViews() {
    const viewMap = {};
    this.views.forEach(view => {
      viewMap[view.id] = view;
    });
    return viewMap;
  }

  getView(viewOrViewId) {
    return typeof viewOrViewId === 'string' ? this.views.find(view => view.id === viewOrViewId) : viewOrViewId;
  }

  getViewState(viewId) {
    const view = this.getView(viewId);
    const viewState = view && this.viewState[view.getViewStateId()] || this.viewState;
    return view ? view.filterViewState(viewState) : viewState;
  }

  getViewport(viewId) {
    return this._viewportMap[viewId];
  }

  project(xyz) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      topLeft: true
    };
    const viewports = this.getViewports();

    for (let i = viewports.length - 1; i >= 0; --i) {
      const viewport = viewports[i];

      if (viewport.contains(xyz, opts)) {
        return viewport.project(xyz, opts);
      }
    }

    return null;
  }

  unproject(xyz, opts) {
    const viewports = this.getViewports();

    for (let i = viewports.length - 1; i >= 0; --i) {
      const viewport = viewports[i];

      if (viewport.containsPixel(xyz, opts)) {
        return viewport.unproject(xyz);
      }
    }

    return null;
  }

  setProps(props) {
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

  _update() {
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

  _setSize(width, height) {
    assert(Number.isFinite(width) && Number.isFinite(height));

    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.setNeedsUpdate('Size changed');
    }
  }

  _setViews(views) {
    views = flatten(views, {
      filter: Boolean
    }).map(view => view instanceof Viewport ? new View({
      viewportInstance: view
    }) : view);

    const viewsChanged = this._diffViews(views, this.views);

    if (viewsChanged) {
      this.setNeedsUpdate('views changed');
    }

    this.views = views;
  }

  _setViewState(viewState) {
    if (viewState) {
      const viewStateChanged = !deepEqual(viewState, this.viewState);

      if (viewStateChanged) {
        this.setNeedsUpdate('viewState changed');
      }

      this.viewState = viewState;
    } else {
      log.warn('setting null viewState')();
    }
  }

  _onViewStateChange(viewId, event) {
    event.viewId = viewId;

    this._eventCallbacks.onViewStateChange(event);
  }

  _createController(props) {
    const Controller = props.type;
    const controller = new Controller(Object.assign({
      eventManager: this._eventManager,
      onViewStateChange: this._onViewStateChange.bind(this, props.id),
      onStateChange: this._eventCallbacks.onInteractiveStateChange
    }, props));
    return controller;
  }

  _updateController(view, viewState, viewport, controller) {
    if (view.controller) {
      const controllerProps = Object.assign({}, view.controller, viewState, {
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

  _rebuildViewports() {
    const {
      width,
      height,
      views
    } = this;
    const oldControllers = this.controllers;
    this.controllers = {};
    this._viewports = views.map(view => {
      const viewState = this.getViewState(view);
      const viewport = view.makeViewport({
        width,
        height,
        viewState
      });
      this.controllers[view.id] = this._updateController(view, viewState, viewport, oldControllers[view.id]);
      return viewport;
    });

    for (const id in oldControllers) {
      if (oldControllers[id] && !this.controllers[id]) {
        oldControllers[id].finalize();
      }
    }

    this._buildViewportMap();
  }

  _buildViewportMap() {
    this._viewportMap = {};

    this._viewports.forEach(viewport => {
      if (viewport.id) {
        this._viewportMap[viewport.id] = this._viewportMap[viewport.id] || viewport;
      }
    });
  }

  _diffViews(newViews, oldViews) {
    if (newViews.length !== oldViews.length) {
      return true;
    }

    return newViews.some((_, i) => !newViews[i].equals(oldViews[i]));
  }

}
//# sourceMappingURL=view-manager.js.map