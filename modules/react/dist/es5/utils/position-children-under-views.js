"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = positionChildrenUnderViews;

var _react = require("react");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _inheritsFrom = require("./inherits-from");

var _evaluateChildren = _interopRequireDefault(require("./evaluate-children"));

function positionChildrenUnderViews(_ref) {
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
      _keplerOutdatedDeck.log.removed('viewportId', '<View>')();
    }

    if (child.props.viewId) {
      _keplerOutdatedDeck.log.removed('viewId', '<View>')();
    }

    let viewId = defaultViewId;
    let viewChildren = child;

    if ((0, _inheritsFrom.inheritsFrom)(child.type, _keplerOutdatedDeck.View)) {
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
    viewChildren = (0, _evaluateChildren.default)(viewChildren, {
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
      viewChildren = (0, _react.createElement)(ContextProvider, {
        value: contextValue
      }, viewChildren);
    }

    return (0, _react.createElement)('div', {
      key,
      id: key,
      style
    }, viewChildren);
  });
}
//# sourceMappingURL=position-children-under-views.js.map