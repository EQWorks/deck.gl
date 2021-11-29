import React, { createElement } from 'react';
import { inheritsFrom } from './inherits-from';
import { Layer, View } from 'kepler-outdated-deck.gl-core';

function wrapInView(node) {
  if (!node) {
    return node;
  }

  if (typeof node === 'function') {
    return createElement(View, {}, node);
  }

  if (Array.isArray(node)) {
    return node.map(wrapInView);
  }

  if (inheritsFrom(node.type, View)) {
    return node;
  }

  return node;
}

export default function extractJSXLayers(_ref) {
  let children = _ref.children,
      layers = _ref.layers,
      views = _ref.views;
  const reactChildren = [];
  const jsxLayers = [];
  const jsxViews = {};
  React.Children.forEach(wrapInView(children), reactElement => {
    if (reactElement) {
      const ElementType = reactElement.type;

      if (inheritsFrom(ElementType, Layer)) {
        const layer = createLayer(ElementType, reactElement.props);
        jsxLayers.push(layer);
      } else {
        reactChildren.push(reactElement);
      }

      if (ElementType !== View && inheritsFrom(ElementType, View) && reactElement.props.id) {
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