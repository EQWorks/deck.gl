"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _view = _interopRequireDefault(require("./view"));

var _webMercatorViewport = _interopRequireDefault(require("../viewports/web-mercator-viewport"));

var _mapController = _interopRequireDefault(require("../controllers/map-controller"));

class MapView extends _view.default {
  constructor(props) {
    super(Object.assign({}, props, {
      type: _webMercatorViewport.default
    }));
  }

  get controller() {
    return this._getControllerProps({
      type: _mapController.default
    });
  }

}

exports.default = MapView;
MapView.displayName = 'MapView';
//# sourceMappingURL=map-view.js.map