"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _extractJsxLayers = _interopRequireDefault(require("./utils/extract-jsx-layers"));

var _positionChildrenUnderViews = _interopRequireDefault(require("./utils/position-children-under-views"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const {
  memoize
} = _keplerOutdatedDeck.experimental;

const propTypes = _keplerOutdatedDeck.Deck.getPropTypes(_propTypes.default);

const defaultProps = _keplerOutdatedDeck.Deck.defaultProps;

class DeckGL extends _react.default.Component {
  constructor(props) {
    super(props);
    this.viewports = null;
    this.children = null;
    this._needsRedraw = null;
    this.pickObject = this.pickObject.bind(this);
    this.pickMultipleObjects = this.pickObject.bind(this);
    this.pickObjects = this.pickObject.bind(this);
    this._extractJSXLayers = memoize(_extractJsxLayers.default);
    this._positionChildrenUnderViews = memoize(_positionChildrenUnderViews.default);
  }

  componentDidMount() {
    const DeckClass = this.props.Deck || _keplerOutdatedDeck.Deck;
    this.deck = this.deck || new DeckClass(Object.assign({}, this.props, {
      canvas: this.deckCanvas,
      _customRender: this._customRender.bind(this)
    }));

    this._updateFromProps(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this._updateFromProps(nextProps);

    const childrenChanged = this.children !== this._parseJSX(nextProps).children;

    const viewsChanged = this.deck.viewManager && this.deck.viewManager.needsRedraw();
    return childrenChanged && !viewsChanged;
  }

  componentDidUpdate() {
    this._redrawDeck();
  }

  componentWillUnmount() {
    this.deck.finalize();
  }

  pickObject(_ref) {
    let {
      x,
      y,
      radius = 0,
      layerIds = null
    } = _ref;
    return this.deck.pickObject({
      x,
      y,
      radius,
      layerIds
    });
  }

  pickMultipleObjects(_ref2) {
    let {
      x,
      y,
      radius = 0,
      layerIds = null,
      depth = 10
    } = _ref2;
    return this.deck.pickMultipleObjects({
      x,
      y,
      radius,
      layerIds,
      depth
    });
  }

  pickObjects(_ref3) {
    let {
      x,
      y,
      width = 1,
      height = 1,
      layerIds = null
    } = _ref3;
    return this.deck.pickObjects({
      x,
      y,
      width,
      height,
      layerIds
    });
  }

  _redrawDeck() {
    if (this._needsRedraw) {
      this.deck._drawLayers(this._needsRedraw);

      this._needsRedraw = null;
    }
  }

  _customRender(redrawReason) {
    this._needsRedraw = redrawReason;
    const viewports = this.deck.viewManager.getViewports();

    if (viewports !== this.viewports) {
      this.forceUpdate();
    } else {
      this._redrawDeck();
    }
  }

  _parseJSX(props) {
    return this._extractJSXLayers({
      layers: props.layers,
      views: props.views,
      children: props.children
    });
  }

  _updateFromProps(props) {
    const {
      layers,
      views
    } = this._parseJSX(props);

    const deckProps = Object.assign({}, props, {
      layers,
      views
    });
    this.deck.setProps(deckProps);
  }

  render() {
    const {
      viewManager
    } = this.deck || {};
    this.viewports = viewManager && viewManager.getViewports();
    this.children = this._parseJSX(this.props).children;

    const children = this._positionChildrenUnderViews({
      children: this.children,
      viewports: this.viewports,
      deck: this.deck,
      ContextProvider: this.props.ContextProvider
    });

    const style = Object.assign({}, {
      position: 'absolute',
      left: 0,
      top: 0
    }, this.props.style);
    const canvas = (0, _react.createElement)('canvas', {
      ref: c => this.deckCanvas = c,
      key: 'deck-canvas',
      id: this.props.id,
      style
    });
    return (0, _react.createElement)('div', {
      id: 'deckgl-wrapper'
    }, [children, canvas]);
  }

}

exports.default = DeckGL;
DeckGL.propTypes = propTypes;
DeckGL.defaultProps = defaultProps;
//# sourceMappingURL=deckgl.js.map