"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _multiIconLayer = _interopRequireDefault(require("./multi-icon-layer/multi-icon-layer"));

var _fontAtlasManager = _interopRequireWildcard(require("./font-atlas-manager"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const DEFAULT_FONT_SETTINGS = {
  fontSize: _fontAtlasManager.DEFAULT_FONT_SIZE,
  buffer: _fontAtlasManager.DEFAULT_BUFFER,
  sdf: false,
  radius: _fontAtlasManager.DEFAULT_RADIUS,
  cutoff: _fontAtlasManager.DEFAULT_CUTOFF
};
const TEXT_ANCHOR = {
  start: 1,
  middle: 0,
  end: -1
};
const ALIGNMENT_BASELINE = {
  top: 1,
  center: 0,
  bottom: -1
};
const DEFAULT_COLOR = [0, 0, 0, 255];
const MISSING_CHAR_WIDTH = 32;
const FONT_SETTINGS_PROPS = ['fontSize', 'buffer', 'sdf', 'radius', 'cutoff'];
const defaultProps = {
  fp64: false,
  billboard: true,
  sizeScale: 1,
  sizeUnits: 'pixels',
  sizeMinPixels: 0,
  sizeMaxPixels: Number.MAX_SAFE_INTEGER,
  characterSet: _fontAtlasManager.DEFAULT_CHAR_SET,
  fontFamily: _fontAtlasManager.DEFAULT_FONT_FAMILY,
  fontWeight: _fontAtlasManager.DEFAULT_FONT_WEIGHT,
  fontSettings: {},
  getText: {
    type: 'accessor',
    value: x => x.text
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
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

class TextLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      fontAtlasManager: new _fontAtlasManager.default(this.context.gl)
    };
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;
    const fontChanged = this.fontChanged(oldProps, props);

    if (fontChanged) {
      this.updateFontAtlas({
        oldProps,
        props
      });
    }

    if (changeFlags.dataChanged || fontChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getText)) {
      this.transformStringToLetters();
    }
  }

  finalizeState() {
    super.finalizeState();
    this.state.fontAtlasManager.finalize();
  }

  updateFontAtlas(_ref2) {
    let {
      oldProps,
      props
    } = _ref2;
    const {
      characterSet,
      fontSettings,
      fontFamily,
      fontWeight
    } = props;
    const fontAtlasManager = this.state.fontAtlasManager;
    fontAtlasManager.setProps(Object.assign({}, DEFAULT_FONT_SETTINGS, fontSettings, {
      characterSet,
      fontFamily,
      fontWeight
    }));
    const {
      scale,
      texture,
      mapping
    } = fontAtlasManager;
    this.setState({
      scale,
      iconAtlas: texture,
      iconMapping: mapping
    });
    this.setNeedsRedraw(true);
  }

  fontChanged(oldProps, props) {
    if (oldProps.fontFamily !== props.fontFamily || oldProps.characterSet !== props.characterSet || oldProps.fontWeight !== props.fontWeight) {
      return true;
    }

    if (oldProps.fontSettings === props.fontSettings) {
      return false;
    }

    const oldFontSettings = oldProps.fontSettings || {};
    const fontSettings = props.fontSettings || {};
    return FONT_SETTINGS_PROPS.some(prop => oldFontSettings[prop] !== fontSettings[prop]);
  }

  getPickingInfo(_ref3) {
    let {
      info
    } = _ref3;
    return Object.assign(info, {
      object: info.index >= 0 ? this.props.data[info.index] : null
    });
  }

  transformStringToLetters() {
    const {
      data,
      getText
    } = this.props;
    const {
      iconMapping
    } = this.state;
    const transformedData = [];
    const {
      iterable,
      objectInfo
    } = (0, _keplerOutdatedDeck.createIterable)(data);

    for (const object of iterable) {
      objectInfo.index++;
      const text = getText(object, objectInfo);

      if (text) {
        const letters = Array.from(text);
        const offsets = [0];
        let offsetLeft = 0;
        letters.forEach((letter, i) => {
          const datum = {
            text: letter,
            index: i,
            offsets,
            len: text.length,
            object,
            objectIndex: objectInfo.index
          };
          const frame = iconMapping[letter];

          if (frame) {
            offsetLeft += frame.width;
          } else {
            _keplerOutdatedDeck.log.warn("Missing character: ".concat(letter))();

            offsetLeft += MISSING_CHAR_WIDTH;
          }

          offsets.push(offsetLeft);
          transformedData.push(datum);
        });
      }
    }

    this.setState({
      data: transformedData
    });
  }

  getLetterOffset(datum) {
    return datum.offsets[datum.index];
  }

  getTextLength(datum) {
    return datum.offsets[datum.offsets.length - 1];
  }

  _getAccessor(accessor) {
    if (typeof accessor === 'function') {
      return x => accessor(x.object);
    }

    return accessor;
  }

  getAnchorXFromTextAnchor(getTextAnchor) {
    return x => {
      const textAnchor = typeof getTextAnchor === 'function' ? getTextAnchor(x.object) : getTextAnchor;

      if (!TEXT_ANCHOR.hasOwnProperty(textAnchor)) {
        throw new Error("Invalid text anchor parameter: ".concat(textAnchor));
      }

      return TEXT_ANCHOR[textAnchor];
    };
  }

  getAnchorYFromAlignmentBaseline(getAlignmentBaseline) {
    return x => {
      const alignmentBaseline = typeof getAlignmentBaseline === 'function' ? getAlignmentBaseline(x.object) : getAlignmentBaseline;

      if (!ALIGNMENT_BASELINE.hasOwnProperty(alignmentBaseline)) {
        throw new Error("Invalid alignment baseline parameter: ".concat(alignmentBaseline));
      }

      return ALIGNMENT_BASELINE[alignmentBaseline];
    };
  }

  renderLayers() {
    const {
      data,
      scale,
      iconAtlas,
      iconMapping
    } = this.state;
    const {
      getPosition,
      getColor,
      getSize,
      getAngle,
      getTextAnchor,
      getAlignmentBaseline,
      getPixelOffset,
      fp64,
      billboard,
      sdf,
      sizeScale,
      sizeUnits,
      sizeMinPixels,
      sizeMaxPixels,
      transitions,
      updateTriggers
    } = this.props;
    const SubLayerClass = this.getSubLayerClass('characters', _multiIconLayer.default);
    return new SubLayerClass({
      sdf,
      iconAtlas,
      iconMapping,
      getPosition: d => getPosition(d.object),
      getColor: this._getAccessor(getColor),
      getSize: this._getAccessor(getSize),
      getAngle: this._getAccessor(getAngle),
      getAnchorX: this.getAnchorXFromTextAnchor(getTextAnchor),
      getAnchorY: this.getAnchorYFromAlignmentBaseline(getAlignmentBaseline),
      getPixelOffset: this._getAccessor(getPixelOffset),
      fp64,
      billboard,
      sizeScale: sizeScale * scale,
      sizeUnits,
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
      data,
      getIcon: d => d.text,
      getShiftInQueue: d => this.getLetterOffset(d),
      getLengthOfQueue: d => this.getTextLength(d)
    });
  }

}

exports.default = TextLayer;
TextLayer.layerName = 'TextLayer';
TextLayer.defaultProps = defaultProps;
//# sourceMappingURL=text-layer.js.map