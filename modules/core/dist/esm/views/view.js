import Viewport from '../viewports/viewport';
import { parsePosition, getPosition } from '../utils/positions';
import { deepEqual } from '../utils/deep-equal';
import assert from '../utils/assert';
export default class View {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = null,
      x = 0,
      y = 0,
      width = '100%',
      height = '100%',
      projectionMatrix = null,
      fovy = 50,
      near = 0.1,
      far = 1000,
      modelMatrix = null,
      viewportInstance = null,
      type = Viewport
    } = props;
    assert(!viewportInstance || viewportInstance instanceof Viewport);
    this.viewportInstance = viewportInstance;
    this.id = id || this.constructor.displayName || 'view';
    this.type = type;
    this.props = Object.assign({}, props, {
      projectionMatrix,
      fovy,
      near,
      far,
      modelMatrix
    });

    this._parseDimensions({
      x,
      y,
      width,
      height
    });

    this.equals = this.equals.bind(this);
    Object.seal(this);
  }

  equals(view) {
    if (this === view) {
      return true;
    }

    if (this.viewportInstance) {
      return view.viewportInstance && this.viewportInstance.equals(view.viewportInstance);
    }

    const viewChanged = deepEqual(this.props, view.props);
    return viewChanged;
  }

  makeViewport(_ref) {
    let {
      width,
      height,
      viewState
    } = _ref;

    if (this.viewportInstance) {
      return this.viewportInstance;
    }

    viewState = this.filterViewState(viewState);
    const viewportDimensions = this.getDimensions({
      width,
      height
    });
    const props = Object.assign({
      viewState
    }, viewState, this.props, viewportDimensions);
    return this._getViewport(props);
  }

  getViewStateId() {
    switch (typeof this.props.viewState) {
      case 'string':
        return this.props.viewState;

      case 'object':
        return this.props.viewState && this.props.viewState.id;

      default:
        return this.id;
    }
  }

  filterViewState(viewState) {
    if (this.props.viewState && typeof this.props.viewState === 'object') {
      if (!this.props.viewState.id) {
        return this.props.viewState;
      }

      const newViewState = Object.assign({}, viewState);

      for (const key in this.props.viewState) {
        if (key !== 'id') {
          newViewState[key] = this.props.viewState[key];
        }
      }

      return newViewState;
    }

    return viewState;
  }

  getDimensions(_ref2) {
    let {
      width,
      height
    } = _ref2;
    return {
      x: getPosition(this._x, width),
      y: getPosition(this._y, height),
      width: getPosition(this._width, width),
      height: getPosition(this._height, height)
    };
  }

  _getControllerProps(defaultOpts) {
    let opts = this.props.controller;

    if (!opts) {
      return null;
    }

    if (opts === true) {
      return defaultOpts;
    }

    if (typeof opts === 'function') {
      opts = {
        type: opts
      };
    }

    return Object.assign({}, defaultOpts, opts);
  }

  _getViewport(props) {
    const {
      type: ViewportType
    } = this;
    return new ViewportType(props);
  }

  _parseDimensions(_ref3) {
    let {
      x,
      y,
      width,
      height
    } = _ref3;
    this._x = parsePosition(x);
    this._y = parsePosition(y);
    this._width = parsePosition(width);
    this._height = parsePosition(height);
  }

}
//# sourceMappingURL=view.js.map