"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _deckUtils = require("./deck-utils");

var MapboxLayer = function () {
  function MapboxLayer(props) {
    (0, _classCallCheck2.default)(this, MapboxLayer);

    if (!props.id) {
      throw new Error('Layer must have an unique id');
    }

    this.id = props.id;
    this.type = 'custom';
    this.renderingMode = props.renderingMode || '3d';
    this.map = null;
    this.deck = null;
    this.props = props;
  }

  (0, _createClass2.default)(MapboxLayer, [{
    key: "onAdd",
    value: function onAdd(map, gl) {
      this.map = map;
      this.deck = (0, _deckUtils.getDeckInstance)({
        map: map,
        gl: gl,
        deck: this.props.deck
      });
      (0, _deckUtils.addLayer)(this.deck, this);
    }
  }, {
    key: "onRemove",
    value: function onRemove() {
      (0, _deckUtils.removeLayer)(this.deck, this);
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      Object.assign(this.props, props, {
        id: this.id
      });

      if (this.deck) {
        (0, _deckUtils.updateLayer)(this.deck, this);
      }
    }
  }, {
    key: "render",
    value: function render(gl, matrix) {
      (0, _deckUtils.drawLayer)(this.deck, this.map, this);
    }
  }]);
  return MapboxLayer;
}();

exports.default = MapboxLayer;
//# sourceMappingURL=mapbox-layer.js.map