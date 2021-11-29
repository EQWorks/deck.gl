"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _shallowEqualObjects = require("../utils/shallow-equal-objects.js");

var _parseJson = _interopRequireDefault(require("../parsers/parse-json"));

var _convertJson = require("../parsers/convert-json");

class JSONConverter {
  constructor(props) {
    this.configuration = {};

    this.onJSONChange = () => {};

    this.setProps(props);
  }

  finalize() {}

  setProps(props) {
    if ('configuration' in props) {
      this.configuration = props.configuration;
    }

    if ('onJSONChange' in props) {
      this.onJSONChange = props.onJSONChange;
    }
  }

  convertJsonToDeckProps(json) {
    if (!json || json === this.json) {
      return this.deckProps;
    }

    this.json = json;
    const parsedJSON = (0, _parseJson.default)(json);
    const jsonProps = (0, _convertJson.convertTopLevelJSON)(parsedJSON, this.configuration);

    if ('initialViewState' in jsonProps) {
      const updateViewState = !this.initialViewState || !(0, _shallowEqualObjects.shallowEqualObjects)(jsonProps.initialViewState, this.initialViewState);

      if (updateViewState) {
        jsonProps.viewState = jsonProps.initialViewState;
        this.initialViewState = jsonProps.initialViewState;
      }

      delete jsonProps.initialViewState;
    }

    this.deckProps = jsonProps;
    return jsonProps;
  }

}

exports.default = JSONConverter;
//# sourceMappingURL=json-converter.js.map