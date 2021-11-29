import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { GridCellLayer } from 'kepler-outdated-deck.gl-layers';
import BinSorter from '../utils/bin-sorter';
import { defaultColorRange } from '../utils/color-utils';
import { getQuantizeScale, getLinearScale } from '../utils/scale-utils';
import { pointToDensityGridDataCPU } from './grid-aggregator';
import { getValueFunc } from '../utils/aggregation-operation-utils';

function nop() {}

const defaultMaterial = new PhongMaterial();
const defaultProps = {
  colorDomain: null,
  colorRange: defaultColorRange,
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
export default class CPUGridLayer extends CompositeLayer {
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
    let oldProps = _ref.oldProps,
        props = _ref.props,
        changeFlags = _ref.changeFlags;
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
    let getColorValue = props.getColorValue,
        getElevationValue = props.getElevationValue;
    const _this$props = this.props,
          colorAggregation = _this$props.colorAggregation,
          getColorWeight = _this$props.getColorWeight,
          elevationAggregation = _this$props.elevationAggregation,
          getElevationWeight = _this$props.getElevationWeight;

    const _this$colorElevationP = this.colorElevationPropsChanged(oldProps, props),
          colorChanged = _this$colorElevationP.colorChanged,
          elevationChanged = _this$colorElevationP.elevationChanged;

    if (colorChanged && getColorValue === null) {
      getColorValue = getValueFunc(colorAggregation, getColorWeight);
    }

    if (elevationChanged && getElevationValue === null) {
      getElevationValue = getValueFunc(elevationAggregation, getElevationWeight);
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
    const dimensionUpdaters = this.state.dimensionUpdaters;
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
    let info = _ref2.info;
    const _this$state = this.state,
          sortedColorBins = _this$state.sortedColorBins,
          sortedElevationBins = _this$state.sortedElevationBins;
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
    const dimensionUpdaters = this.state.dimensionUpdaters;
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
    const _this$props2 = this.props,
          data = _this$props2.data,
          cellSize = _this$props2.cellSize,
          getPosition = _this$props2.getPosition;

    const _pointToDensityGridDa = pointToDensityGridDataCPU(data, cellSize, getPosition),
          layerData = _pointToDensityGridDa.layerData;

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
    const getColorValue = this.state.getColorValue;
    const sortedColorBins = new BinSorter(this.state.layerData || [], getColorValue);
    this.setState({
      sortedColorBins
    });
    this.getColorValueDomain();
  }

  getSortedElevationBins() {
    const getElevationValue = this.state.getElevationValue;
    const sortedElevationBins = new BinSorter(this.state.layerData || [], getElevationValue);
    this.setState({
      sortedElevationBins
    });
    this.getElevationValueDomain();
  }

  getColorValueDomain() {
    const _this$props3 = this.props,
          lowerPercentile = _this$props3.lowerPercentile,
          upperPercentile = _this$props3.upperPercentile,
          onSetColorDomain = _this$props3.onSetColorDomain;
    this.state.colorValueDomain = this.state.sortedColorBins.getValueRange([lowerPercentile, upperPercentile]);

    if (typeof onSetColorDomain === 'function') {
      onSetColorDomain(this.state.colorValueDomain);
    }

    this.getColorScale();
  }

  getElevationValueDomain() {
    const _this$props4 = this.props,
          elevationLowerPercentile = _this$props4.elevationLowerPercentile,
          elevationUpperPercentile = _this$props4.elevationUpperPercentile,
          onSetElevationDomain = _this$props4.onSetElevationDomain;
    this.state.elevationValueDomain = this.state.sortedElevationBins.getValueRange([elevationLowerPercentile, elevationUpperPercentile]);

    if (typeof onSetElevationDomain === 'function') {
      onSetElevationDomain(this.state.elevationValueDomain);
    }

    this.getElevationScale();
  }

  getColorScale() {
    const colorRange = this.props.colorRange;
    const colorDomain = this.props.colorDomain || this.state.colorValueDomain;
    this.state.colorScaleFunc = getQuantizeScale(colorDomain, colorRange);
  }

  getElevationScale() {
    const elevationRange = this.props.elevationRange;
    const elevationDomain = this.props.elevationDomain || this.state.elevationValueDomain;
    this.state.elevationScaleFunc = getLinearScale(elevationDomain, elevationRange);
  }

  _onGetSublayerColor(cell) {
    const _this$state2 = this.state,
          sortedColorBins = _this$state2.sortedColorBins,
          colorScaleFunc = _this$state2.colorScaleFunc,
          colorValueDomain = _this$state2.colorValueDomain;
    const cv = sortedColorBins.binMap[cell.index] && sortedColorBins.binMap[cell.index].value;
    const colorDomain = this.props.colorDomain || colorValueDomain;
    const isColorValueInDomain = cv >= colorDomain[0] && cv <= colorDomain[colorDomain.length - 1];
    const color = isColorValueInDomain ? colorScaleFunc(cv) : [0, 0, 0, 0];
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;
    return color;
  }

  _onGetSublayerElevation(cell) {
    const _this$state3 = this.state,
          sortedElevationBins = _this$state3.sortedElevationBins,
          elevationScaleFunc = _this$state3.elevationScaleFunc,
          elevationValueDomain = _this$state3.elevationValueDomain;
    const ev = sortedElevationBins.binMap[cell.index] && sortedElevationBins.binMap[cell.index].value;
    const elevationDomain = this.props.elevationDomain || elevationValueDomain;
    const isElevationValueInDomain = ev >= elevationDomain[0] && ev <= elevationDomain[elevationDomain.length - 1];
    return isElevationValueInDomain ? elevationScaleFunc(ev) : -1;
  }

  renderLayers() {
    const _this$props5 = this.props,
          elevationScale = _this$props5.elevationScale,
          fp64 = _this$props5.fp64,
          extruded = _this$props5.extruded,
          cellSize = _this$props5.cellSize,
          coverage = _this$props5.coverage,
          material = _this$props5.material,
          transitions = _this$props5.transitions;
    const SubLayerClass = this.getSubLayerClass('grid-cell', GridCellLayer);
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
CPUGridLayer.layerName = 'CPUGridLayer';
CPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=cpu-grid-layer.js.map