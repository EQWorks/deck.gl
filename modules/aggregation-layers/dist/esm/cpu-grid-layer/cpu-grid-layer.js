import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer } from 'kepler-outdated-deck.gl-core';
import { GridCellLayer } from 'kepler-outdated-deck.gl-layers';
import BinSorter from '../utils/bin-sorter';
import { defaultColorRange } from '../utils/color-utils';
import { getQuantizeScale, getLinearScale } from '../utils/scale-utils';
import { pointToDensityGridDataCPU } from './grid-aggregator';
import { getValueFunc } from '../utils/aggregation-operation-utils';

function nop() {}

var defaultMaterial = new PhongMaterial();
var defaultProps = {
  colorDomain: null,
  colorRange: defaultColorRange,
  getColorValue: {
    type: 'accessor',
    value: null
  },
  getColorWeight: {
    type: 'accessor',
    value: function value(x) {
      return 1;
    }
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
    value: function value(x) {
      return 1;
    }
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
    value: function value(x) {
      return x.position;
    }
  },
  extruded: false,
  fp64: false,
  material: defaultMaterial
};
var COLOR_PROPS = ['getColorValue', 'colorAggregation', 'getColorWeight'];
var ELEVATION_PROPS = ['getElevationValue', 'elevationAggregation', 'getElevationWeight'];

var CPUGridLayer = function (_CompositeLayer) {
  _inherits(CPUGridLayer, _CompositeLayer);

  function CPUGridLayer() {
    _classCallCheck(this, CPUGridLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(CPUGridLayer).apply(this, arguments));
  }

  _createClass(CPUGridLayer, [{
    key: "initializeState",
    value: function initializeState() {
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
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var _this = this;

      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      this.updateGetValueFuncs(oldProps, props);
      var reprojectNeeded = this.needsReProjectPoints(oldProps, props, changeFlags);

      if (changeFlags.dataChanged || reprojectNeeded) {
        this.getLayerData();
      } else {
        var dimensionChanges = this.getDimensionChanges(oldProps, props) || [];
        dimensionChanges.forEach(function (f) {
          return typeof f === 'function' && f.apply(_this);
        });
      }
    }
  }, {
    key: "colorElevationPropsChanged",
    value: function colorElevationPropsChanged(oldProps, props) {
      var colorChanged = false;
      var elevationChanged = false;

      for (var _i = 0; _i < COLOR_PROPS.length; _i++) {
        var p = COLOR_PROPS[_i];

        if (oldProps[p] !== props[p]) {
          colorChanged = true;
        }
      }

      for (var _i2 = 0; _i2 < ELEVATION_PROPS.length; _i2++) {
        var _p = ELEVATION_PROPS[_i2];

        if (oldProps[_p] !== props[_p]) {
          elevationChanged = true;
        }
      }

      return {
        colorChanged: colorChanged,
        elevationChanged: elevationChanged
      };
    }
  }, {
    key: "updateGetValueFuncs",
    value: function updateGetValueFuncs(oldProps, props) {
      var getColorValue = props.getColorValue,
          getElevationValue = props.getElevationValue;
      var _this$props = this.props,
          colorAggregation = _this$props.colorAggregation,
          getColorWeight = _this$props.getColorWeight,
          elevationAggregation = _this$props.elevationAggregation,
          getElevationWeight = _this$props.getElevationWeight;

      var _this$colorElevationP = this.colorElevationPropsChanged(oldProps, props),
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
          getColorValue: getColorValue
        });
      }

      if (getElevationValue) {
        this.setState({
          getElevationValue: getElevationValue
        });
      }
    }
  }, {
    key: "needsReProjectPoints",
    value: function needsReProjectPoints(oldProps, props, changeFlags) {
      return oldProps.cellSize !== props.cellSize || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition);
    }
  }, {
    key: "getDimensionUpdaters",
    value: function getDimensionUpdaters() {
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
  }, {
    key: "getDimensionChanges",
    value: function getDimensionChanges(oldProps, props) {
      var dimensionUpdaters = this.state.dimensionUpdaters;
      var updaters = [];

      for (var dimensionKey in dimensionUpdaters) {
        var needUpdate = dimensionUpdaters[dimensionKey].find(function (item) {
          return item.triggers.some(function (t) {
            return oldProps[t] !== props[t];
          });
        });

        if (needUpdate) {
          updaters.push(needUpdate.updater);
        }
      }

      return updaters.length ? updaters : null;
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;
      var _this$state = this.state,
          sortedColorBins = _this$state.sortedColorBins,
          sortedElevationBins = _this$state.sortedElevationBins;
      var isPicked = info.picked && info.index > -1;
      var object = null;

      if (isPicked) {
        var cell = this.state.layerData[info.index];
        var colorValue = sortedColorBins.binMap[cell.index] && sortedColorBins.binMap[cell.index].value;
        var elevationValue = sortedElevationBins.binMap[cell.index] && sortedElevationBins.binMap[cell.index].value;
        object = Object.assign({
          colorValue: colorValue,
          elevationValue: elevationValue
        }, cell);
      }

      return Object.assign(info, {
        picked: Boolean(object),
        object: object
      });
    }
  }, {
    key: "getUpdateTriggers",
    value: function getUpdateTriggers() {
      var _this2 = this;

      var dimensionUpdaters = this.state.dimensionUpdaters;
      var updateTriggers = {};

      var _loop = function _loop(dimensionKey) {
        updateTriggers[dimensionKey] = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = dimensionUpdaters[dimensionKey][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var step = _step.value;
            step.triggers.forEach(function (prop) {
              updateTriggers[dimensionKey][prop] = _this2.props[prop];
            });
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
      };

      for (var dimensionKey in dimensionUpdaters) {
        _loop(dimensionKey);
      }

      return updateTriggers;
    }
  }, {
    key: "getLayerData",
    value: function getLayerData() {
      var _this$props2 = this.props,
          data = _this$props2.data,
          cellSize = _this$props2.cellSize,
          getPosition = _this$props2.getPosition;

      var _pointToDensityGridDa = pointToDensityGridDataCPU(data, cellSize, getPosition),
          layerData = _pointToDensityGridDa.layerData;

      this.setState({
        layerData: layerData
      });
      this.getSortedBins();
    }
  }, {
    key: "getValueDomain",
    value: function getValueDomain() {
      this.getColorValueDomain();
      this.getElevationValueDomain();
    }
  }, {
    key: "getSortedBins",
    value: function getSortedBins() {
      this.getSortedColorBins();
      this.getSortedElevationBins();
    }
  }, {
    key: "getSortedColorBins",
    value: function getSortedColorBins() {
      var getColorValue = this.state.getColorValue;
      var sortedColorBins = new BinSorter(this.state.layerData || [], getColorValue);
      this.setState({
        sortedColorBins: sortedColorBins
      });
      this.getColorValueDomain();
    }
  }, {
    key: "getSortedElevationBins",
    value: function getSortedElevationBins() {
      var getElevationValue = this.state.getElevationValue;
      var sortedElevationBins = new BinSorter(this.state.layerData || [], getElevationValue);
      this.setState({
        sortedElevationBins: sortedElevationBins
      });
      this.getElevationValueDomain();
    }
  }, {
    key: "getColorValueDomain",
    value: function getColorValueDomain() {
      var _this$props3 = this.props,
          lowerPercentile = _this$props3.lowerPercentile,
          upperPercentile = _this$props3.upperPercentile,
          onSetColorDomain = _this$props3.onSetColorDomain;
      this.state.colorValueDomain = this.state.sortedColorBins.getValueRange([lowerPercentile, upperPercentile]);

      if (typeof onSetColorDomain === 'function') {
        onSetColorDomain(this.state.colorValueDomain);
      }

      this.getColorScale();
    }
  }, {
    key: "getElevationValueDomain",
    value: function getElevationValueDomain() {
      var _this$props4 = this.props,
          elevationLowerPercentile = _this$props4.elevationLowerPercentile,
          elevationUpperPercentile = _this$props4.elevationUpperPercentile,
          onSetElevationDomain = _this$props4.onSetElevationDomain;
      this.state.elevationValueDomain = this.state.sortedElevationBins.getValueRange([elevationLowerPercentile, elevationUpperPercentile]);

      if (typeof onSetElevationDomain === 'function') {
        onSetElevationDomain(this.state.elevationValueDomain);
      }

      this.getElevationScale();
    }
  }, {
    key: "getColorScale",
    value: function getColorScale() {
      var colorRange = this.props.colorRange;
      var colorDomain = this.props.colorDomain || this.state.colorValueDomain;
      this.state.colorScaleFunc = getQuantizeScale(colorDomain, colorRange);
    }
  }, {
    key: "getElevationScale",
    value: function getElevationScale() {
      var elevationRange = this.props.elevationRange;
      var elevationDomain = this.props.elevationDomain || this.state.elevationValueDomain;
      this.state.elevationScaleFunc = getLinearScale(elevationDomain, elevationRange);
    }
  }, {
    key: "_onGetSublayerColor",
    value: function _onGetSublayerColor(cell) {
      var _this$state2 = this.state,
          sortedColorBins = _this$state2.sortedColorBins,
          colorScaleFunc = _this$state2.colorScaleFunc,
          colorValueDomain = _this$state2.colorValueDomain;
      var cv = sortedColorBins.binMap[cell.index] && sortedColorBins.binMap[cell.index].value;
      var colorDomain = this.props.colorDomain || colorValueDomain;
      var isColorValueInDomain = cv >= colorDomain[0] && cv <= colorDomain[colorDomain.length - 1];
      var color = isColorValueInDomain ? colorScaleFunc(cv) : [0, 0, 0, 0];
      color[3] = Number.isFinite(color[3]) ? color[3] : 255;
      return color;
    }
  }, {
    key: "_onGetSublayerElevation",
    value: function _onGetSublayerElevation(cell) {
      var _this$state3 = this.state,
          sortedElevationBins = _this$state3.sortedElevationBins,
          elevationScaleFunc = _this$state3.elevationScaleFunc,
          elevationValueDomain = _this$state3.elevationValueDomain;
      var ev = sortedElevationBins.binMap[cell.index] && sortedElevationBins.binMap[cell.index].value;
      var elevationDomain = this.props.elevationDomain || elevationValueDomain;
      var isElevationValueInDomain = ev >= elevationDomain[0] && ev <= elevationDomain[elevationDomain.length - 1];
      return isElevationValueInDomain ? elevationScaleFunc(ev) : -1;
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      var _this$props5 = this.props,
          elevationScale = _this$props5.elevationScale,
          fp64 = _this$props5.fp64,
          extruded = _this$props5.extruded,
          cellSize = _this$props5.cellSize,
          coverage = _this$props5.coverage,
          material = _this$props5.material,
          transitions = _this$props5.transitions;
      var SubLayerClass = this.getSubLayerClass('grid-cell', GridCellLayer);
      return new SubLayerClass({
        fp64: fp64,
        cellSize: cellSize,
        coverage: coverage,
        material: material,
        elevationScale: elevationScale,
        extruded: extruded,
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
  }]);

  return CPUGridLayer;
}(CompositeLayer);

export { CPUGridLayer as default };
CPUGridLayer.layerName = 'CPUGridLayer';
CPUGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=cpu-grid-layer.js.map