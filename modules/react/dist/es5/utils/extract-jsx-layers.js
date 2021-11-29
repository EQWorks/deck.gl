"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractJSXLayers;

var _react = _interopRequireWildcard(require("react"));

var _inheritsFrom = require("./inherits-from");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function wrapInView(node) {
  if (!node) {
    return node;
  }

  if (typeof node === 'function') {
    return (0, _react.createElement)(_keplerOutdatedDeck.View, {}, node);
  }

  if (Array.isArray(node)) {
    return node.map(wrapInView);
  }

  if ((0, _inheritsFrom.inheritsFrom)(node.type, _keplerOutdatedDeck.View)) {
    return node;
  }

  return node;
}

function extractJSXLayers(_ref) {
  let {
    children,
    layers,
    views
  } = _ref;
  const reactChildren = [];
  const jsxLayers = [];
  const jsxViews = {};

  _react.default.Children.forEach(wrapInView(children), reactElement => {
    if (reactElement) {
      const ElementType = reactElement.type;

      if ((0, _inheritsFrom.inheritsFrom)(ElementType, _keplerOutdatedDeck.Layer)) {
        const layer = createLayer(ElementType, reactElement.props);
        jsxLayers.push(layer);
      } else {
        reactChildren.push(reactElement);
      }

      if (ElementType !== _keplerOutdatedDeck.View && (0, _inheritsFrom.inheritsFrom)(ElementType, _keplerOutdatedDeck.View) && reactElement.props.id) {
        const view = new ElementType(reactElement.props);
        jsxViews[view.id] = view;
      }
    }
  });

  if (Object.keys(jsxViews).length > 0) {
    if (Array.isArray(views)) {
      views.forEach(view => {
        jsxViews[view.id] = view;
      });
    } else if (views) {
      jsxViews[views.id] = views;
    }

    views = Object.values(jsxViews);
  }

  layers = jsxLayers.length > 0 ? [...jsxLayers, ...layers] : layers;
  return {
    layers,
    children: reactChildren,
    views
  };
}

function createLayer(LayerType, reactProps) {
  const props = {};
  const defaultProps = LayerType.defaultProps || {};

  for (const key in reactProps) {
    if (defaultProps[key] !== reactProps[key]) {
      props[key] = reactProps[key];
    }
  }

  return new LayerType(props);
}
//# sourceMappingURL=extract-jsx-layers.js.map