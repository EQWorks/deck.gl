"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeckGLView = exports.DeckGLModel = void 0;

var _base = require("@jupyter-widgets/base");

var _version = require("./version");

var _utils = require("./utils");

const mapboxgl = require('mapbox-gl');

const deckgl = require('kepler-outdated-deck.gl-core');

const deckglLayers = require('kepler-outdated-deck.gl-layers');

const deckAggregationLayers = require('kepler-outdated-deck.gl-aggregation-layers');

const deckJson = require('kepler-outdated-deck.gl-json');

const MAPBOX_CSS_URL = 'https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css';

class DeckGLModel extends _base.DOMWidgetModel {
  defaults() {
    return { ...super.defaults(),
      _model_name: DeckGLModel.model_name,
      _model_module: DeckGLModel.model_module,
      _model_module_version: DeckGLModel.model_module_version,
      _view_name: DeckGLModel.view_name,
      _view_module: DeckGLModel.view_module,
      _view_module_version: DeckGLModel.view_module_version
    };
  }

  static get serializers() {
    return { ..._base.DOMWidgetModel.serializers
    };
  }

  static get model_name() {
    return 'DeckGLModel';
  }

  static get model_module() {
    return _version.MODULE_NAME;
  }

  static get model_module_version() {
    return _version.MODULE_VERSION;
  }

  static get view_name() {
    return 'DeckGLView';
  }

  static get view_module() {
    return _version.MODULE_NAME;
  }

  static get view_module_version() {
    return _version.MODULE_VERSION;
  }

}

exports.DeckGLModel = DeckGLModel;
const TICK_RATE_MILLISECONDS = 100;

class DeckGLView extends _base.DOMWidgetView {
  render() {
    this.modelId = this.model.model_id;
    super.render();
    this.listenTo(this.model, 'change:json_input', this.value_changed);
    (0, _utils.loadCss)(MAPBOX_CSS_URL);
    const [width, height] = [this.model.get('width'), this.model.get('height')];
    (0, _utils.createDeckScaffold)(this.el, this.modelId, width, height);
    (0, _utils.waitForElementToDisplay)("#deck-map-wrapper-".concat(this.modelId), TICK_RATE_MILLISECONDS, this.initJSElements.bind(this));
  }

  _onViewStateChange(_ref) {
    let {
      viewState
    } = _ref;
    this.deck.setProps({
      viewState
    });
    (0, _utils.setMapProps)(this.mapLayer, {
      viewState
    });
  }

  initJSElements() {
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

  value_changed() {
    this.json_input = this.model.get('json_input');
    const parsedJSONInput = JSON.parse(this.json_input);
    this.initJSElements();
    const jsonConverter = new deckJson._JSONConverter({
      configuration: {
        layers: { ...deckglLayers,
          ...deckAggregationLayers
        }
      }
    });
    const results = jsonConverter.convertJsonToDeckProps(parsedJSONInput);
    this.deck.setProps(results);
    (0, _utils.hideMapboxCSSWarning)();
    (0, _utils.setMapProps)(this.mapLayer, this.deck.props);
  }

}

exports.DeckGLView = DeckGLView;
//# sourceMappingURL=widget.js.map