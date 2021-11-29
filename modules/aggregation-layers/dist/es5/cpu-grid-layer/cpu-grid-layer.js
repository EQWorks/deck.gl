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

var _gridAggregator = require("./grid-aggregator");

var _aggregationOperationUtils = require("../utils/aggregation-operation-utils");

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
    min: 0,
    max: 100,
    value: 0
  },
  upperPercentile: {
    type: 'number',
    min: 0,
    max: 100,
    value: 100
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
    min: 0,
    max: 100,
    value: 0
  },
  elevationUpperPercentile: {
    type: 'number',
    min: 0,
    max: 100,
    value: 100
  },
  elevationScale: 1,
  onSetElevationDomain: nop,
  cellSize: {
    type: 'number',
    min: 0,
    max: 1000,
    value: 1000
  },
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  extruded: false,
  fp64: false,
  material: defaultMaterial
};
const COLOR_PROPS = ['getColorValue', 'colorAggregation', 'getColorWeight'];
const ELEVATION_PROPS = ['getElevationValue', 'elevationAggregation', 'getElevationWeight'];

class CPUGridLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    this.state = {
      layerData: [],
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
    const reprojectNeeded = this.needsReProjectPoints(oldProps, props, changeFlags);

    if (changeFlags.dataChanged || reprojectNeeded) {
      this.getLayerData();
    } else {
      const dimensionChanges = this.getDimensionChanges(oldProps, props) || [];
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

  needsReProjectPoints(oldProps, props, changeFlags) {
    return oldProps.cellSize !== props.cellSize || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition);
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
      const cell = this.state.layerData[info.index];
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

  getLayerData() {
    const {
      data,
      cellSize,
      getPosition
    } = this.props;
    const {
      layerData
    } = (0, _gridAggregator.pointToDensityGridDataCPU)(data, cellSize, getPosition);
    this.setState({
      layerData
    });
    this.getSortedBins();
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
    const sortedColorBins = new _binSorter.default(this.state.layerData || [], getColorValue);
    this.setState({
      sortedColorBins
    });
    this.getColorValueDomain();
  }

  getSortedElevationBins() {
    const {
      getElevationValue
    } = this.state;
    const sortedElevationBins = new _binSorter.default(this.state.layerData || [], getElevationValue);
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
      fp64,
      extruded,
      cellSize,
      coverage,
      material,
      transitions
    } = this.props;
    const SubLayerClass = this.getSubLayerClass('grid-cell', _keplerOutdatedDeck2.GridCellLayer);
    return new SubLayerClass({
      fp64,
      cellSize,
      coverage,
      material,
      elevationScale,
      extruded,
      getFillColor: this._onGetSublayerColor.bind(this),
      getElevation: this._onGetSublayerElevation.bind(this),
      transitions: transitions && {
        getFillColor: transitions.getColorValue || transitions.getColorWeight,
        getElevation: transitions.getElevationValue || transitions.getElevationWeight
      }
    }, this.getSubLayerProps({
      id: 'grid-cell',
      updateTriggers: this.getUpdateTriggers()
    }), {
      data: this.state.layerData
    });
  }

}

exports.default = CPUGridLayer;
CPUGridLayer.layerName = 'CPUGridLayer';
CPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=cpu-grid-layer.js.map