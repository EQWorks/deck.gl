import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { CompositeLayer, log, createIterable } from 'kepler-outdated-deck.gl-core';
import MultiIconLayer from './multi-icon-layer/multi-icon-layer';
import FontAtlasManager, { DEFAULT_CHAR_SET, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE, DEFAULT_BUFFER, DEFAULT_RADIUS, DEFAULT_CUTOFF } from './font-atlas-manager';
var DEFAULT_FONT_SETTINGS = {
  fontSize: DEFAULT_FONT_SIZE,
  buffer: DEFAULT_BUFFER,
  sdf: false,
  radius: DEFAULT_RADIUS,
  cutoff: DEFAULT_CUTOFF
};
var TEXT_ANCHOR = {
  start: 1,
  middle: 0,
  end: -1
};
var ALIGNMENT_BASELINE = {
  top: 1,
  center: 0,
  bottom: -1
};
var DEFAULT_COLOR = [0, 0, 0, 255];
var MISSING_CHAR_WIDTH = 32;
var FONT_SETTINGS_PROPS = ['fontSize', 'buffer', 'sdf', 'radius', 'cutoff'];
var defaultProps = {
  fp64: false,
  billboard: true,
  sizeScale: 1,
  sizeUnits: 'pixels',
  sizeMinPixels: 0,
  sizeMaxPixels: Number.MAX_SAFE_INTEGER,
  characterSet: DEFAULT_CHAR_SET,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: DEFAULT_FONT_WEIGHT,
  fontSettings: {},
  getText: {
    type: 'accessor',
    value: function value(x) {
      return x.text;
    }
  },
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getSize: {
    type: 'accessor',
    value: 32
  },
  getAngle: {
    type: 'accessor',
    value: 0
  },
  getTextAnchor: {
    type: 'accessor',
    value: 'middle'
  },
  getAlignmentBaseline: {
    type: 'accessor',
    value: 'center'
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  }
};

var TextLayer = function (_CompositeLayer) {
  _inherits(TextLayer, _CompositeLayer);

  function TextLayer() {
    _classCallCheck(this, TextLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(TextLayer).apply(this, arguments));
  }

  _createClass(TextLayer, [{
    key: "initializeState",
    value: function initializeState() {
      this.state = {
        fontAtlasManager: new FontAtlasManager(this.context.gl)
      };
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;
      var fontChanged = this.fontChanged(oldProps, props);

      if (fontChanged) {
        this.updateFontAtlas({
          oldProps: oldProps,
          props: props
        });
      }

      if (changeFlags.dataChanged || fontChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getText)) {
        this.transformStringToLetters();
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(TextLayer.prototype), "finalizeState", this).call(this);

      this.state.fontAtlasManager.finalize();
    }
  }, {
    key: "updateFontAtlas",
    value: function updateFontAtlas(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props;
      var characterSet = props.characterSet,
          fontSettings = props.fontSettings,
          fontFamily = props.fontFamily,
          fontWeight = props.fontWeight;
      var fontAtlasManager = this.state.fontAtlasManager;
      fontAtlasManager.setProps(Object.assign({}, DEFAULT_FONT_SETTINGS, fontSettings, {
        characterSet: characterSet,
        fontFamily: fontFamily,
        fontWeight: fontWeight
      }));
      var scale = fontAtlasManager.scale,
          texture = fontAtlasManager.texture,
          mapping = fontAtlasManager.mapping;
      this.setState({
        scale: scale,
        iconAtlas: texture,
        iconMapping: mapping
      });
      this.setNeedsRedraw(true);
    }
  }, {
    key: "fontChanged",
    value: function fontChanged(oldProps, props) {
      if (oldProps.fontFamily !== props.fontFamily || oldProps.characterSet !== props.characterSet || oldProps.fontWeight !== props.fontWeight) {
        return true;
      }

      if (oldProps.fontSettings === props.fontSettings) {
        return false;
      }

      var oldFontSettings = oldProps.fontSettings || {};
      var fontSettings = props.fontSettings || {};
      return FONT_SETTINGS_PROPS.some(function (prop) {
        return oldFontSettings[prop] !== fontSettings[prop];
      });
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref3) {
      var info = _ref3.info;
      return Object.assign(info, {
        object: info.index >= 0 ? this.props.data[info.index] : null
      });
    }
  }, {
    key: "transformStringToLetters",
    value: function transformStringToLetters() {
      var _this$props = this.props,
          data = _this$props.data,
          getText = _this$props.getText;
      var iconMapping = this.state.iconMapping;
      var transformedData = [];

      var _createIterable = createIterable(data),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var object = _step.value;
          objectInfo.index++;
          var text = getText(object, objectInfo);

          if (text) {
            var letters = Array.from(text);
            var offsets = [0];
            var offsetLeft = 0;
            letters.forEach(function (letter, i) {
              var datum = {
                text: letter,
                index: i,
                offsets: offsets,
                len: text.length,
                object: object,
                objectIndex: objectInfo.index
              };
              var frame = iconMapping[letter];

              if (frame) {
                offsetLeft += frame.width;
              } else {
                log.warn("Missing character: ".concat(letter))();
                offsetLeft += MISSING_CHAR_WIDTH;
              }

              offsets.push(offsetLeft);
              transformedData.push(datum);
            });
          }
        };

        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.setState({
        data: transformedData
      });
    }
  }, {
    key: "getLetterOffset",
    value: function getLetterOffset(datum) {
      return datum.offsets[datum.index];
    }
  }, {
    key: "getTextLength",
    value: function getTextLength(datum) {
      return datum.offsets[datum.offsets.length - 1];
    }
  }, {
    key: "_getAccessor",
    value: function _getAccessor(accessor) {
      if (typeof accessor === 'function') {
        return function (x) {
          return accessor(x.object);
        };
      }

      return accessor;
    }
  }, {
    key: "getAnchorXFromTextAnchor",
    value: function getAnchorXFromTextAnchor(getTextAnchor) {
      return function (x) {
        var textAnchor = typeof getTextAnchor === 'function' ? getTextAnchor(x.object) : getTextAnchor;

        if (!TEXT_ANCHOR.hasOwnProperty(textAnchor)) {
          throw new Error("Invalid text anchor parameter: ".concat(textAnchor));
        }

        return TEXT_ANCHOR[textAnchor];
      };
    }
  }, {
    key: "getAnchorYFromAlignmentBaseline",
    value: function getAnchorYFromAlignmentBaseline(getAlignmentBaseline) {
      return function (x) {
        var alignmentBaseline = typeof getAlignmentBaseline === 'function' ? getAlignmentBaseline(x.object) : getAlignmentBaseline;

        if (!ALIGNMENT_BASELINE.hasOwnProperty(alignmentBaseline)) {
          throw new Error("Invalid alignment baseline parameter: ".concat(alignmentBaseline));
        }

        return ALIGNMENT_BASELINE[alignmentBaseline];
      };
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this = this;

      var _this$state = this.state,
          data = _this$state.data,
          scale = _this$state.scale,
          iconAtlas = _this$state.iconAtlas,
          iconMapping = _this$state.iconMapping;
      var _this$props2 = this.props,
          _getPosition = _this$props2.getPosition,
          getColor = _this$props2.getColor,
          getSize = _this$props2.getSize,
          getAngle = _this$props2.getAngle,
          getTextAnchor = _this$props2.getTextAnchor,
          getAlignmentBaseline = _this$props2.getAlignmentBaseline,
          getPixelOffset = _this$props2.getPixelOffset,
          fp64 = _this$props2.fp64,
          billboard = _this$props2.billboard,
          sdf = _this$props2.sdf,
          sizeScale = _this$props2.sizeScale,
          sizeUnits = _this$props2.sizeUnits,
          sizeMinPixels = _this$props2.sizeMinPixels,
          sizeMaxPixels = _this$props2.sizeMaxPixels,
          transitions = _this$props2.transitions,
          updateTriggers = _this$props2.updateTriggers;
      var SubLayerClass = this.getSubLayerClass('characters', MultiIconLayer);
      return new SubLayerClass({
        sdf: sdf,
        iconAtlas: iconAtlas,
        iconMapping: iconMapping,
        getPosition: function getPosition(d) {
          return _getPosition(d.object);
        },
        getColor: this._getAccessor(getColor),
        getSize: this._getAccessor(getSize),
        getAngle: this._getAccessor(getAngle),
        getAnchorX: this.getAnchorXFromTextAnchor(getTextAnchor),
        getAnchorY: this.getAnchorYFromAlignmentBaseline(getAlignmentBaseline),
        getPixelOffset: this._getAccessor(getPixelOffset),
        fp64: fp64,
        billboard: billboard,
        sizeScale: sizeScale * scale,
        sizeUnits: sizeUnits,
        sizeMinPixels: sizeMinPixels * scale,
        sizeMaxPixels: sizeMaxPixels * scale,
        transitions: transitions && {
          getPosition: transitions.getPosition,
          getAngle: transitions.getAngle,
          getColor: transitions.getColor,
          getSize: transitions.getSize,
          getPixelOffset: updateTriggers.getPixelOffset
        }
      }, this.getSubLayerProps({
        id: 'characters',
        updateTriggers: {
          getPosition: updateTriggers.getPosition,
          getAngle: updateTriggers.getAngle,
          getColor: updateTriggers.getColor,
          getSize: updateTriggers.getSize,
          getPixelOffset: updateTriggers.getPixelOffset,
          getAnchorX: updateTriggers.getTextAnchor,
          getAnchorY: updateTriggers.getAlignmentBaseline
        }
      }), {
        data: data,
        getIcon: function getIcon(d) {
          return d.text;
        },
        getShiftInQueue: function getShiftInQueue(d) {
          return _this.getLetterOffset(d);
        },
        getLengthOfQueue: function getLengthOfQueue(d) {
          return _this.getTextLength(d);
        }
      });
    }
  }]);

  return TextLayer;
}(CompositeLayer);

export { TextLayer as default };
TextLayer.layerName = 'TextLayer';
TextLayer.defaultProps = defaultProps;
//# sourceMappingURL=text-layer.js.map