"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeckGLView = exports.DeckGLModel = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _base = require("@jupyter-widgets/base");

var _version = require("./version");

var _utils = require("./utils");

var mapboxgl = require('mapbox-gl');

var deckgl = require('kepler-outdated-deck.gl-core');

var deckglLayers = require('kepler-outdated-deck.gl-layers');

var deckAggregationLayers = require('kepler-outdated-deck.gl-aggregation-layers');

var deckJson = require('kepler-outdated-deck.gl-json');

var MAPBOX_CSS_URL = 'https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css';

var DeckGLModel = function (_DOMWidgetModel) {
  (0, _inherits2.default)(DeckGLModel, _DOMWidgetModel);

  function DeckGLModel() {
    (0, _classCallCheck2.default)(this, DeckGLModel);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(DeckGLModel).apply(this, arguments));
  }

  (0, _createClass2.default)(DeckGLModel, [{
    key: "defaults",
    value: function defaults() {
      return (0, _objectSpread2.default)({}, (0, _get2.default)((0, _getPrototypeOf2.default)(DeckGLModel.prototype), "defaults", this).call(this), {
        _model_name: DeckGLModel.model_name,
        _model_module: DeckGLModel.model_module,
        _model_module_version: DeckGLModel.model_module_version,
        _view_name: DeckGLModel.view_name,
        _view_module: DeckGLModel.view_module,
        _view_module_version: DeckGLModel.view_module_version
      });
    }
  }], [{
    key: "serializers",
    get: function get() {
      return (0, _objectSpread2.default)({}, _base.DOMWidgetModel.serializers);
    }
  }, {
    key: "model_name",
    get: function get() {
      return 'DeckGLModel';
    }
  }, {
    key: "model_module",
    get: function get() {
      return _version.MODULE_NAME;
    }
  }, {
    key: "model_module_version",
    get: function get() {
      return _version.MODULE_VERSION;
    }
  }, {
    key: "view_name",
    get: function get() {
      return 'DeckGLView';
    }
  }, {
    key: "view_module",
    get: function get() {
      return _version.MODULE_NAME;
    }
  }, {
    key: "view_module_version",
    get: function get() {
      return _version.MODULE_VERSION;
    }
  }]);
  return DeckGLModel;
}(_base.DOMWidgetModel);

exports.DeckGLModel = DeckGLModel;
var TICK_RATE_MILLISECONDS = 100;

var DeckGLView = function (_DOMWidgetView) {
  (0, _inherits2.default)(DeckGLView, _DOMWidgetView);

  function DeckGLView() {
    (0, _classCallCheck2.default)(this, DeckGLView);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(DeckGLView).apply(this, arguments));
  }

  (0, _createClass2.default)(DeckGLView, [{
    key: "render",
    value: function render() {
      this.modelId = this.model.model_id;
      (0, _get2.default)((0, _getPrototypeOf2.default)(DeckGLView.prototype), "render", this).call(this);
      this.listenTo(this.model, 'change:json_input', this.value_changed);
      (0, _utils.loadCss)(MAPBOX_CSS_URL);
      var _ref = [this.model.get('width'), this.model.get('height')],
          width = _ref[0],
          height = _ref[1];
      (0, _utils.createDeckScaffold)(this.el, this.modelId, width, height);
      (0, _utils.waitForElementToDisplay)("#deck-map-wrapper-".concat(this.modelId), TICK_RATE_MILLISECONDS, this.initJSElements.bind(this));
    }
  }, {
    key: "_onViewStateChange",
    value: function _onViewStateChange(_ref2) {
      var viewState = _ref2.viewState;
      this.deck.setProps({
        viewState: viewState
      });
      (0, _utils.setMapProps)(this.mapLayer, {
        viewState: viewState
      });
    }
  }, {
    key: "initJSElements",
    value: function initJSElements() {
      if (!this.deck) {
        mapboxgl.accessToken = this.model.get('mapbox_key');
        this.deck = new deckgl.Deck({
          canvas: "deck-map-container-".concat(this.modelId),
          height: '100%',
          width: '100%',
          onLoad: this.value_changed.bind(this),
          mapboxApiAccessToken: mapboxgl.accessToken,
          views: [new deckgl.MapView()],
          onViewStateChange: this._onViewStateChange.bind(this)
        });
      }

      if (!this.mapLayer) {
        this.mapLayer = new mapboxgl.Map({
          container: "map-".concat(this.modelId),
          interactive: false,
          style: null
        });
      }
    }
  }, {
    key: "value_changed",
    value: function value_changed() {
      this.json_input = this.model.get('json_input');
      var parsedJSONInput = JSON.parse(this.json_input);
      this.initJSElements();
      var jsonConverter = new deckJson._JSONConverter({
        configuration: {
          layers: (0, _objectSpread2.default)({}, deckglLayers, deckAggregationLayers)
        }
      });
      var results = jsonConverter.convertJsonToDeckProps(parsedJSONInput);
      this.deck.setProps(results);
      (0, _utils.hideMapboxCSSWarning)();
      (0, _utils.setMapProps)(this.mapLayer, this.deck.props);
    }
  }]);
  return DeckGLView;
}(_base.DOMWidgetView);

exports.DeckGLView = DeckGLView;
//# sourceMappingURL=widget.js.map