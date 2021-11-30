import { createElement } from 'react';
import { View, log } from 'kepler-outdated-deck.gl-core';
import { inheritsFrom } from './inherits-from';
import evaluateChildren from './evaluate-children';
export default function positionChildrenUnderViews(_ref) {
  let {
    children,
    viewports,
    deck,
    ContextProvider
  } = _ref;
  const {
    viewManager
  } = deck || {};

  if (!viewManager || !viewManager.views.length) {
    return [];
  }

  const defaultViewId = viewManager.views[0].id;
  return children.map((child, i) => {
    if (child.props.viewportId) {
      log.removed('viewportId', '<View>')();
    }

    if (child.props.viewId) {
      log.removed('viewId', '<View>')();
    }

    let viewId = defaultViewId;
    let viewChildren = child;

    if (inheritsFrom(child.type, View)) {
      viewId = child.props.id || defaultViewId;
      viewChildren = child.props.children;
    }

    const childStyle = viewChildren && viewChildren.props && viewChildren.props.style;
    const viewport = viewManager.getViewport(viewId);
    const viewState = viewManager.getViewState(viewId);

    if (!viewport) {
      return null;
    }

    const {
      x,
      y,
      width,
      height
    } = viewport;
    viewChildren = evaluateChildren(viewChildren, {
      x,
      y,
      width,
      height,
      viewport,
      viewState
    });
    const style = {
      position: 'absolute',
      zIndex: childStyle && childStyle.zIndex,
      pointerEvents: 'none',
      left: x,
      top: y,
      width,
      height
    };
    const key = "view-child-".concat(viewId, "-").concat(i);

    if (ContextProvider) {
      const contextValue = {
        viewport,
        container: deck.canvas.offsetParent,
        eventManager: deck.eventManager,
        onViewStateChange: deck._onViewStateChange
      };
      viewChildren = createElement(ContextProvider, {
        value: contextValue
      }, viewChildren);
    }

    return createElement('div', {
      key,
      id: key,
      style
    }, viewChildren);
  });
}
//# sourceMappingURL=position-children-under-views.js.map