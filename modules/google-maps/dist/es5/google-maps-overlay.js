"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils");

const HIDE_ALL_LAYERS = () => false;

class GoogleMapsOverlay {
  constructor(props) {
    this.props = {};
    this._map = null;
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = this._onAdd.bind(this);
    overlay.onRemove = this._onRemove.bind(this);
    overlay.draw = this._draw.bind(this);
    this._overlay = overlay;
    this.setProps(props);
  }

  setMap(map) {
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

  setProps(props) {
    Object.assign(this.props, props);

    if (this._deck) {
      this._deck.setProps(this.props);
    }
  }

  pickObject(params) {
    return this._deck && this._deck.pickObject(params);
  }

  pickMultipleObjects(params) {
    return this._deck && this._deck.pickMultipleObjects(params);
  }

  pickObjects(params) {
    return this._deck && this._deck.pickObjects(params);
  }

  finalize() {
    this.setMap(null);

    if (this._deck) {
      (0, _utils.destroyDeckInstance)(this._deck);
      this._deck = null;
    }
  }

  _onAdd() {
    this._deck = (0, _utils.createDeckInstance)(this._map, this._overlay, this._deck);

    this._deck.setProps(this.props);
  }

  _onRemove() {
    this._deck.setProps({
      layerFilter: HIDE_ALL_LAYERS
    });
  }

  _draw() {
    const deck = this._deck;
    const {
      width,
      height,
      left,
      top,
      zoom,
      pitch,
      latitude,
      longitude
    } = (0, _utils.getViewState)(this._map, this._overlay);
    const canSyncWithGoogleMaps = zoom >= 0 && pitch === 0;
    deck.canvas.style.left = "".concat(left, "px");
    deck.canvas.style.top = "".concat(top, "px");
    deck.setProps({
      width,
      height,
      viewState: {
        latitude,
        longitude,
        zoom
      },
      layerFilter: canSyncWithGoogleMaps ? this.props.layerFilter : HIDE_ALL_LAYERS
    });
    deck.redraw();
  }

}

exports.default = GoogleMapsOverlay;
//# sourceMappingURL=google-maps-overlay.js.map