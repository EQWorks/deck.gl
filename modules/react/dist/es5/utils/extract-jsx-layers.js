"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractJSXLayers;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _react = _interopRequireWildcard(require("react"));

var _inheritsFrom = require("./inherits-from");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

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
  var children = _ref.children,
      layers = _ref.layers,
      views = _ref.views;
  var reactChildren = [];
  var jsxLayers = [];
  var jsxViews = {};

  _react.default.Children.forEach(wrapInView(children), function (reactElement) {
    if (reactElement) {
      var ElementType = reactElement.type;

      if ((0, _inheritsFrom.inheritsFrom)(ElementType, _keplerOutdatedDeck.Layer)) {
        var layer = createLayer(ElementType, reactElement.props);
        jsxLayers.push(layer);
      } else {
        reactChildren.push(reactElement);
      }

      if (ElementType !== _keplerOutdatedDeck.View && (0, _inheritsFrom.inheritsFrom)(ElementType, _keplerOutdatedDeck.View) && reactElement.props.id) {
        var view = new ElementType(reactElement.props);
        jsxViews[view.id] = view;
      }
    }
  });

  if (Object.keys(jsxViews).length > 0) {
    if (Array.isArray(views)) {
      views.forEach(function (view) {
        jsxViews[view.id] = view;
      });
    } else if (views) {
      jsxViews[views.id] = views;
    }

    views = Object.values(jsxViews);
  }

  layers = jsxLayers.length > 0 ? [].concat(jsxLayers, (0, _toConsumableArray2.default)(layers)) : layers;
  return {
    layers: layers,
    children: reactChildren,
    views: views
  };
}

function createLayer(LayerType, reactProps) {
  var props = {};
  var defaultProps = LayerType.defaultProps || {};

  for (var key in reactProps) {
    if (defaultProps[key] !== reactProps[key]) {
      props[key] = reactProps[key];
    }
  }

  return new LayerType(props);
}
//# sourceMappingURL=extract-jsx-layers.js.map