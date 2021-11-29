"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _binSorter = _interopRequireDefault(require("../utils/bin-sorter"));

var _colorUtils = require("../utils/color-utils");

var _scaleUtils = require("../utils/scale-utils");

var _aggregationOperationUtils = require("../utils/aggregation-operation-utils");

var _hexagonAggregator = require("./hexagon-aggregator");

function nop() {}

const defaultMaterial = new _core.PhongMaterial();
const defaultProps = {
  colorDomain: null,
  colorRange: _colorUtils.defaultColorRange,
  getColorValue: {
    type: 'accessor',
    value: null
  },
  getColorWeight: {
    type: 'accessor',
    value: x => 1
  },
  colorAggregation: 'SUM',
  lowerPercentile: {
    type: 'number',
    value: 0,
    min: 0,
    max: 100
  },
  upperPercentile: {
    type: 'number',
    value: 100,
    min: 0,
    max: 100
  },
  onSetColorDomain: nop,
  elevationDomain: null,
  elevationRange: [0, 1000],
  getElevationValue: {
    type: 'accessor',
    value: null
  },
  getElevationWeight: {
    type: 'accessor',
    value: x => 1
  },
  elevationAggregation: 'SUM',
  elevationLowerPercentile: {
    type: 'number',
    value: 0,
    min: 0,
    max: 100
  },
  elevationUpperPercentile: {
    type: 'number',
    value: 100,
    min: 0,
    max: 100
  },
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  onSetElevationDomain: nop,
  radius: {
    type: 'number',
    value: 1000,
    min: 1
  },
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  extruded: false,
  hexagonAggregator: _hexagonAggregator.pointToHexbin,
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  fp64: false,
  material: defaultMaterial
};
const COLOR_PROPS = ['getColorValue', 'colorAggregation', 'getColorWeight'];
const ELEVATION_PROPS = ['getElevationValue', 'elevationAggregation', 'getElevationWeight'];

class HexagonLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      hexagons: [],
      sortedColorBins: null,
      sortedElevationBins: null,
      colorValueDomain: null,
      elevationValueDomain: null,
      colorScaleFunc: nop,
      elevationScaleFunc: nop,
      dimensionUpdaters: this.getDimensionUpdaters()
    };
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    this.updateGetValueFuncs(oldProps, props);
    const dimensionChanges = this.getDimensionChanges(oldProps, props);

    if (changeFlags.dataChanged || this.needsReProjectPoints(oldProps, props)) {
      this.getHexagons();
    } else if (dimensionChanges) {
      dimensionChanges.forEach(f => typeof f === 'function' && f.apply(this));
    }
  }

  colorElevationPropsChanged(oldProps, props) {
    let colorChanged = false;
    let elevationChanged = false;

    for (const p of COLOR_PROPS) {
      if (oldProps[p] !== props[p]) {
        colorChanged = true;
      }
    }

    for (const p of ELEVATION_PROPS) {
      if (oldProps[p] !== props[p]) {
        elevationChanged = true;
      }
    }

    return {
      colorChanged,
      elevationChanged
    };
  }

  updateGetValueFuncs(oldProps, props) {
    let {
      getColorValue,
      getElevationValue
    } = props;
    const {
      colorAggregation,
      getColorWeight,
      elevationAggregation,
      getElevationWeight
    } = this.props;
    const {
      colorChanged,
      elevationChanged
    } = this.colorElevationPropsChanged(oldProps, props);

    if (colorChanged && getColorValue === null) {
      getColorValue = (0, _aggregationOperationUtils.getValueFunc)(colorAggregation, getColorWeight);
    }

    if (elevationChanged && getElevationValue === null) {
      getElevationValue = (0, _aggregationOperationUtils.getValueFunc)(elevationAggregation, getElevationWeight);
    }

    if (getColorValue) {
      this.setState({
        getColorValue
      });
    }

    if (getElevationValue) {
      this.setState({
        getElevationValue
      });
    }
  }

  needsReProjectPoints(oldProps, props) {
    return oldProps.radius !== props.radius || oldProps.hexagonAggregator !== props.hexagonAggregator;
  }

  getDimensionUpdaters() {
    return {
      getFillColor: [{
        id: 'value',
        triggers: ['getColorValue', 'getColorWeight', 'colorAggregation'],
        updater: this.getSortedColorBins
      }, {
        id: 'domain',
        triggers: ['lowerPercentile', 'upperPercentile'],
        updater: this.getColorValueDomain
      }, {
        id: 'scaleFunc',
        triggers: ['colorDomain', 'colorRange'],
        updater: this.getColorScale
      }],
      getElevation: [{
        id: 'value',
        triggers: ['getElevationValue', 'getElevationWeight', 'elevationAggregation'],
        updater: this.getSortedElevationBins
      }, {
        id: 'domain',
        triggers: ['elevationLowerPercentile', 'elevationUpperPercentile'],
        updater: this.getElevationValueDomain
      }, {
        id: 'scaleFunc',
        triggers: ['elevationDomain', 'elevationRange'],
        updater: this.getElevationScale
      }]
    };
  }

  getDimensionChanges(oldProps, props) {
    const {
      dimensionUpdaters
    } = this.state;
    const updaters = [];

    for (const dimensionKey in dimensionUpdaters) {
      const needUpdate = dimensionUpdaters[dimensionKey].find(item => item.triggers.some(t => oldProps[t] !== props[t]));

      if (needUpdate) {
        updaters.push(needUpdate.updater);
      }
    }

    return updaters.length ? updaters : null;
  }

  getHexagons() {
    const {
      hexagonAggregator
    } = this.props;
    const {
      viewport
    } = this.context;
    const {
      hexagons,
      hexagonVertices
    } = hexagonAggregator(this.props, viewport);
    this.updateRadiusAngle(hexagonVertices);
    this.setState({
      hexagons
    });
    this.getSortedBins();
  }

  getPickingInfo(_ref2) {
    let {
      info
    } = _ref2;
    const {
      sortedColorBins,
      sortedElevationBins
    } = this.state;
    const isPicked = info.picked && info.index > -1;
    let object = null;

    if (isPicked) {
      const cell = this.state.hexagons[info.index];
      const colorValue = sortedColorBins.binMap[cell.index] && sortedColorBins.binMap[cell.index].value;
      const elevationValue = sortedElevationBins.binMap[cell.index] && sortedElevationBins.binMap[cell.index].value;
      object = Object.assign({
        colorValue,
        elevationValue
      }, cell);
    }

    return Object.assign(info, {
      picked: Boolean(object),
      object
    });
  }

  getUpdateTriggers() {
    const {
      dimensionUpdaters
    } = this.state;
    const updateTriggers = {};

    for (const dimensionKey in dimensionUpdaters) {
      updateTriggers[dimensionKey] = {};

      for (const step of dimensionUpdaters[dimensionKey]) {
        step.triggers.forEach(prop => {
          updateTriggers[dimensionKey][prop] = this.props[prop];
        });
      }
    }

    return updateTriggers;
  }

  updateRadiusAngle(vertices) {
    let {
      radius
    } = this.props;
    let angle = 90;

    if (Array.isArray(vertices)) {
      if (vertices.length < 6) {
        _keplerOutdatedDeck.log.error('HexagonCellLayer: hexagonVertices needs to be an array of 6 points')();
      }

      const vertex0 = vertices[0];
      const vertex3 = vertices[3];
      const {
        viewport
      } = this.context;
      const {
        pixelsPerMeter
      } = viewport.getDistanceScales();
      const spaceCoord0 = this.projectFlat(vertex0);
      const spaceCoord3 = this.projectFlat(vertex3);
      const dx = spaceCoord0[0] - spaceCoord3[0];
      const dy = spaceCoord0[1] - spaceCoord3[1];
      const dxy = Math.sqrt(dx * dx + dy * dy);
      angle = Math.acos(dx / dxy) * -Math.sign(dy) / Math.PI * 180 + 90;
      radius = dxy / 2 / pixelsPerMeter[0];
    }

    this.setState({
      angle,
      radius
    });
  }

  getValueDomain() {
    this.getColorValueDomain();
    this.getElevationValueDomain();
  }

  getSortedBins() {
    this.getSortedColorBins();
    this.getSortedElevationBins();
  }

  getSortedColorBins() {
    const {
      getColorValue
    } = this.state;
    const sortedColorBins = new _binSorter.default(this.state.hexagons || [], getColorValue);
    this.setState({
      sortedColorBins
    });
    this.getColorValueDomain();
  }

  getSortedElevationBins() {
    const {
      getElevationValue
    } = this.state;
    const sortedElevationBins = new _binSorter.default(this.state.hexagons || [], getElevationValue);
    this.setState({
      sortedElevationBins
    });
    this.getElevationValueDomain();
  }

  getColorValueDomain() {
    const {
      lowerPercentile,
      upperPercentile,
      onSetColorDomain
    } = this.props;

    if (lowerPercentile > upperPercentile) {
      _keplerOutdatedDeck.log.warn('HexagonLayer: lowerPercentile is bigger than upperPercentile')();
    }

    this.state.colorValueDomain = this.state.sortedColorBins.getValueRange([lowerPercentile, upperPercentile]);

    if (typeof onSetColorDomain === 'function') {
      onSetColorDomain(this.state.colorValueDomain);
    }

    this.getColorScale();
  }

  getElevationValueDomain() {
    const {
      elevationLowerPercentile,
      elevationUpperPercentile,
      onSetElevationDomain
    } = this.props;
    this.state.elevationValueDomain = this.state.sortedElevationBins.getValueRange([elevationLowerPercentile, elevationUpperPercentile]);

    if (typeof onSetElevationDomain === 'function') {
      onSetElevationDomain(this.state.elevationValueDomain);
    }

    this.getElevationScale();
  }

  getColorScale() {
    const {
      colorRange
    } = this.props;
    const colorDomain = this.props.colorDomain || this.state.colorValueDomain;
    this.state.colorScaleFunc = (0, _scaleUtils.getQuantizeScale)(colorDomain, colorRange);
  }

  getElevationScale() {
    const {
      elevationRange
    } = this.props;
    const elevationDomain = this.props.elevationDomain || this.state.elevationValueDomain;
    this.state.elevationScaleFunc = (0, _scaleUtils.getLinearScale)(elevationDomain, elevationRange);
  }

  _onGetSublayerColor(cell) {
    const {
      sortedColorBins,
      colorScaleFunc,
      colorValueDomain
    } = this.state;
    const cv = sortedColorBins.binMap[cell.index] && sortedColorBins.binMap[cell.index].value;
    const colorDomain = this.props.colorDomain || colorValueDomain;
    const isColorValueInDomain = cv >= colorDomain[0] && cv <= colorDomain[colorDomain.length - 1];
    const color = isColorValueInDomain ? colorScaleFunc(cv) : [0, 0, 0, 0];
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;
    return color;
  }

  _onGetSublayerElevation(cell) {
    const {
      sortedElevationBins,
      elevationScaleFunc,
      elevationValueDomain
    } = this.state;
    const ev = sortedElevationBins.binMap[cell.index] && sortedElevationBins.binMap[cell.index].value;
    const elevationDomain = this.props.elevationDomain || elevationValueDomain;
    const isElevationValueInDomain = ev >= elevationDomain[0] && ev <= elevationDomain[elevationDomain.length - 1];
    return isElevationValueInDomain ? elevationScaleFunc(ev) : -1;
  }

  renderLayers() {
    const {
      elevationScale,
      extruded,
      coverage,
      material,
      fp64,
      transitions
    } = this.props;
    const {
      angle,
      radius
    } = this.state;
    const SubLayerClass = this.getSubLayerClass('hexagon-cell', _keplerOutdatedDeck2.ColumnLayer);
    return new SubLayerClass({
      fp64,
      radius,
      diskResolution: 6,
      elevationScale,
      angle,
      extruded,
      coverage,
      material,
      getFillColor: this._onGetSublayerColor.bind(this),
      getElevation: this._onGetSublayerElevation.bind(this),
      transitions: transitions && {
        getFillColor: transitions.getColorValue || transitions.getColorWeight,
        getElevation: transitions.getElevationValue || transitions.getElevationWeight
      }
    }, this.getSubLayerProps({
      id: 'hexagon-cell',
      updateTriggers: this.getUpdateTriggers()
    }), {
      data: this.state.hexagons
    });
  }

}

exports.default = HexagonLayer;
HexagonLayer.layerName = 'HexagonLayer';
HexagonLayer.defaultProps = defaultProps;
//# sourceMappingURL=hexagon-layer.js.map