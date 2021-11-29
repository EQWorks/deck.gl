import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { createDeckScaffold, loadCss, hideMapboxCSSWarning, setMapProps, waitForElementToDisplay } from './utils';

var mapboxgl = require('mapbox-gl');

var deckgl = require('kepler-outdated-deck.gl-core');

var deckglLayers = require('kepler-outdated-deck.gl-layers');

var deckAggregationLayers = require('kepler-outdated-deck.gl-aggregation-layers');

var deckJson = require('kepler-outdated-deck.gl-json');

var MAPBOX_CSS_URL = 'https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css';
export var DeckGLModel = function (_DOMWidgetModel) {
  _inherits(DeckGLModel, _DOMWidgetModel);

  function DeckGLModel() {
    _classCallCheck(this, DeckGLModel);

    return _possibleConstructorReturn(this, _getPrototypeOf(DeckGLModel).apply(this, arguments));
  }

  _createClass(DeckGLModel, [{
    key: "defaults",
    value: function defaults() {
      return _objectSpread({}, _get(_getPrototypeOf(DeckGLModel.prototype), "defaults", this).call(this), {
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
      return _objectSpread({}, DOMWidgetModel.serializers);
    }
  }, {
    key: "model_name",
    get: function get() {
      return 'DeckGLModel';
    }
  }, {
    key: "model_module",
    get: function get() {
      return MODULE_NAME;
    }
  }, {
    key: "model_module_version",
    get: function get() {
      return MODULE_VERSION;
    }
  }, {
    key: "view_name",
    get: function get() {
      return 'DeckGLView';
    }
  }, {
    key: "view_module",
    get: function get() {
      return MODULE_NAME;
    }
  }, {
    key: "view_module_version",
    get: function get() {
      return MODULE_VERSION;
    }
  }]);

  return DeckGLModel;
}(DOMWidgetModel);
var TICK_RATE_MILLISECONDS = 100;
export var DeckGLView = function (_DOMWidgetView) {
  _inherits(DeckGLView, _DOMWidgetView);

  function DeckGLView() {
    _classCallCheck(this, DeckGLView);

    return _possibleConstructorReturn(this, _getPrototypeOf(DeckGLView).apply(this, arguments));
  }

  _createClass(DeckGLView, [{
    key: "render",
    value: function render() {
      this.modelId = this.model.model_id;

      _get(_getPrototypeOf(DeckGLView.prototype), "render", this).call(this);

      this.listenTo(this.model, 'change:json_input', this.value_changed);
      loadCss(MAPBOX_CSS_URL);
      var _ref = [this.model.get('width'), this.model.get('height')],
          width = _ref[0],
          height = _ref[1];
      createDeckScaffold(this.el, this.modelId, width, height);
      waitForElementToDisplay("#deck-map-wrapper-".concat(this.modelId), TICK_RATE_MILLISECONDS, this.initJSElements.bind(this));
    }
  }, {
    key: "_onViewStateChange",
    value: function _onViewStateChange(_ref2) {
      var viewState = _ref2.viewState;
      this.deck.setProps({
        viewState: viewState
      });
      setMapProps(this.mapLayer, {
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
          layers: _objectSpread({}, deckglLayers, deckAggregationLayers)
        }
      });
      var results = jsonConverter.convertJsonToDeckProps(parsedJSONInput);
      this.deck.setProps(results);
      hideMapboxCSSWarning();
      setMapProps(this.mapLayer, this.deck.props);
    }
  }]);

  return DeckGLView;
}(DOMWidgetView);
//# sourceMappingURL=widget.js.map