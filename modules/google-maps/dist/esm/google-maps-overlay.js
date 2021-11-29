import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import { createDeckInstance, destroyDeckInstance, getViewState } from './utils';

var HIDE_ALL_LAYERS = function HIDE_ALL_LAYERS() {
  return false;
};

var GoogleMapsOverlay = function () {
  function GoogleMapsOverlay(props) {
    _classCallCheck(this, GoogleMapsOverlay);

    this.props = {};
    this._map = null;
    var overlay = new google.maps.OverlayView();
    overlay.onAdd = this._onAdd.bind(this);
    overlay.onRemove = this._onRemove.bind(this);
    overlay.draw = this._draw.bind(this);
    this._overlay = overlay;
    this.setProps(props);
  }

  _createClass(GoogleMapsOverlay, [{
    key: "setMap",
    value: function setMap(map) {
      if (map === this._map) {
        return;
      }

      if (this._map) {
        this._overlay.setMap(null);

        this._map = null;
      }

      if (map) {
        this._map = map;

        this._overlay.setMap(map);
      }
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      Object.assign(this.props, props);

      if (this._deck) {
        this._deck.setProps(this.props);
      }
    }
  }, {
    key: "pickObject",
    value: function pickObject(params) {
      return this._deck && this._deck.pickObject(params);
    }
  }, {
    key: "pickMultipleObjects",
    value: function pickMultipleObjects(params) {
      return this._deck && this._deck.pickMultipleObjects(params);
    }
  }, {
    key: "pickObjects",
    value: function pickObjects(params) {
      return this._deck && this._deck.pickObjects(params);
    }
  }, {
    key: "finalize",
    value: function finalize() {
      this.setMap(null);

      if (this._deck) {
        destroyDeckInstance(this._deck);
        this._deck = null;
      }
    }
  }, {
    key: "_onAdd",
    value: function _onAdd() {
      this._deck = createDeckInstance(this._map, this._overlay, this._deck);

      this._deck.setProps(this.props);
    }
  }, {
    key: "_onRemove",
    value: function _onRemove() {
      this._deck.setProps({
        layerFilter: HIDE_ALL_LAYERS
      });
    }
  }, {
    key: "_draw",
    value: function _draw() {
      var deck = this._deck;

      var _getViewState = getViewState(this._map, this._overlay),
          width = _getViewState.width,
          height = _getViewState.height,
          left = _getViewState.left,
          top = _getViewState.top,
          zoom = _getViewState.zoom,
          pitch = _getViewState.pitch,
          latitude = _getViewState.latitude,
          longitude = _getViewState.longitude;

      var canSyncWithGoogleMaps = zoom >= 0 && pitch === 0;
      deck.canvas.style.left = "".concat(left, "px");
      deck.canvas.style.top = "".concat(top, "px");
      deck.setProps({
        width: width,
        height: height,
        viewState: {
          latitude: latitude,
          longitude: longitude,
          zoom: zoom
        },
        layerFilter: canSyncWithGoogleMaps ? this.props.layerFilter : HIDE_ALL_LAYERS
      });
      deck.redraw();
    }
  }]);

  return GoogleMapsOverlay;
}();

export { GoogleMapsOverlay as default };
//# sourceMappingURL=google-maps-overlay.js.map