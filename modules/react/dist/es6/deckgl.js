import React, { createElement } from 'react';
import PropTypes from 'prop-types';
import { Deck, experimental } from 'kepler-outdated-deck.gl-core';
const memoize = experimental.memoize;
import extractJSXLayers from './utils/extract-jsx-layers';
import positionChildrenUnderViews from './utils/position-children-under-views';
const propTypes = Deck.getPropTypes(PropTypes);
const defaultProps = Deck.defaultProps;
export default class DeckGL extends React.Component {
  constructor(props) {
    super(props);
    this.viewports = null;
    this.children = null;
    this._needsRedraw = null;
    this.pickObject = this.pickObject.bind(this);
    this.pickMultipleObjects = this.pickObject.bind(this);
    this.pickObjects = this.pickObject.bind(this);
    this._extractJSXLayers = memoize(extractJSXLayers);
    this._positionChildrenUnderViews = memoize(positionChildrenUnderViews);
  }

  componentDidMount() {
    const DeckClass = this.props.Deck || Deck;
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
    let x = _ref.x,
        y = _ref.y,
        _ref$radius = _ref.radius,
        radius = _ref$radius === void 0 ? 0 : _ref$radius,
        _ref$layerIds = _ref.layerIds,
        layerIds = _ref$layerIds === void 0 ? null : _ref$layerIds;
    return this.deck.pickObject({
      x,
      y,
      radius,
      layerIds
    });
  }

  pickMultipleObjects(_ref2) {
    let x = _ref2.x,
        y = _ref2.y,
        _ref2$radius = _ref2.radius,
        radius = _ref2$radius === void 0 ? 0 : _ref2$radius,
        _ref2$layerIds = _ref2.layerIds,
        layerIds = _ref2$layerIds === void 0 ? null : _ref2$layerIds,
        _ref2$depth = _ref2.depth,
        depth = _ref2$depth === void 0 ? 10 : _ref2$depth;
    return this.deck.pickMultipleObjects({
      x,
      y,
      radius,
      layerIds,
      depth
    });
  }

  pickObjects(_ref3) {
    let x = _ref3.x,
        y = _ref3.y,
        _ref3$width = _ref3.width,
        width = _ref3$width === void 0 ? 1 : _ref3$width,
        _ref3$height = _ref3.height,
        height = _ref3$height === void 0 ? 1 : _ref3$height,
        _ref3$layerIds = _ref3.layerIds,
        layerIds = _ref3$layerIds === void 0 ? null : _ref3$layerIds;
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
    const _this$_parseJSX = this._parseJSX(props),
          layers = _this$_parseJSX.layers,
          views = _this$_parseJSX.views;

    const deckProps = Object.assign({}, props, {
      layers,
      views
    });
    this.deck.setProps(deckProps);
  }

  render() {
    const _ref4 = this.deck || {},
          viewManager = _ref4.viewManager;

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
    const canvas = createElement('canvas', {
      ref: c => this.deckCanvas = c,
      key: 'deck-canvas',
      id: this.props.id,
      style
    });
    return createElement('div', {
      id: 'deckgl-wrapper'
    }, [children, canvas]);
  }

}
DeckGL.propTypes = propTypes;
DeckGL.defaultProps = defaultProps;
//# sourceMappingURL=deckgl.js.map