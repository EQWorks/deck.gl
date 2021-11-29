import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Layer, WebMercatorViewport, createIterable, log, experimental } from 'kepler-outdated-deck.gl-core';
var count = experimental.count;
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import GPUGridAggregator from '../utils/gpu-grid-aggregation/gpu-grid-aggregator';
import { AGGREGATION_OPERATION } from '../utils/aggregation-operation-utils';
import { Model, Geometry, Buffer, isWebGL2 } from '@luma.gl/core';
import vs from './screen-grid-layer-vertex.glsl';
import vs_WebGL1 from './screen-grid-layer-vertex-webgl1.glsl';
import fs from './screen-grid-layer-fragment.glsl';
import fs_WebGL1 from './screen-grid-layer-fragment-webgl1.glsl';
var DEFAULT_MINCOLOR = [0, 0, 0, 0];
var DEFAULT_MAXCOLOR = [0, 255, 0, 255];
var AGGREGATION_DATA_UBO_INDEX = 0;
var COLOR_PROPS = ["minColor", "maxColor", "colorRange", "colorDomain"];
var defaultProps = {
  cellSizePixels: {
    value: 100,
    min: 1
  },
  cellMarginPixels: {
    value: 2,
    min: 0,
    max: 5
  },
  colorDomain: null,
  colorRange: defaultColorRange,
  getPosition: {
    type: 'accessor',
    value: function value(d) {
      return d.position;
    }
  },
  getWeight: {
    type: 'accessor',
    value: function value(d) {
      return [1, 0, 0];
    }
  },
  gpuAggregation: true,
  aggregation: 'SUM'
};

var ScreenGridLayer = function (_Layer) {
  _inherits(ScreenGridLayer, _Layer);

  function ScreenGridLayer() {
    _classCallCheck(this, ScreenGridLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(ScreenGridLayer).apply(this, arguments));
  }

  _createClass(ScreenGridLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var shaders = isWebGL2(this.context.gl) ? {
        vs: vs,
        fs: fs
      } : {
        vs: vs_WebGL1,
        fs: fs_WebGL1
      };
      shaders.modules = ['picking'];
      return shaders;
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      var gl = this.context.gl;
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          update: this.calculateInstancePositions
        },
        instanceCounts: {
          size: 4,
          transition: true,
          accessor: ['getPosition', 'getWeight'],
          update: this.calculateInstanceCounts,
          noAlloc: true
        }
      });
      var options = {
        id: "".concat(this.id, "-aggregator"),
        shaderCache: this.context.shaderCache
      };

      var maxBuffer = this._getMaxCountBuffer(gl);

      var weights = {
        color: {
          size: 1,
          operation: AGGREGATION_OPERATION.SUM,
          needMax: true,
          maxBuffer: maxBuffer
        }
      };
      this.setState({
        model: this._getModel(gl),
        gpuGridAggregator: new GPUGridAggregator(gl, options),
        maxBuffer: maxBuffer,
        weights: weights
      });

      this._setupUniformBuffer();
    }
  }, {
    key: "shouldUpdateState",
    value: function shouldUpdateState(_ref) {
      var changeFlags = _ref.changeFlags;
      return changeFlags.somethingChanged;
    }
  }, {
    key: "updateState",
    value: function updateState(opts) {
      _get(_getPrototypeOf(ScreenGridLayer.prototype), "updateState", this).call(this, opts);

      this._updateUniforms(opts);

      if (opts.changeFlags.dataChanged) {
        this._processData();
      }

      var changeFlags = this._getAggregationChangeFlags(opts);

      if (changeFlags) {
        this._updateAggregation(changeFlags);
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(ScreenGridLayer.prototype), "finalizeState", this).call(this);

      var _this$state = this.state,
          aggregationBuffer = _this$state.aggregationBuffer,
          maxBuffer = _this$state.maxBuffer,
          gpuGridAggregator = _this$state.gpuGridAggregator;
      gpuGridAggregator.delete();

      if (aggregationBuffer) {
        aggregationBuffer.delete();
      }

      if (maxBuffer) {
        maxBuffer.delete();
      }
    }
  }, {
    key: "draw",
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var gl = this.context.gl;
      var _this$props$parameter = this.props.parameters,
          parameters = _this$props$parameter === void 0 ? {} : _this$props$parameter;
      var minColor = this.props.minColor || DEFAULT_MINCOLOR;
      var maxColor = this.props.maxColor || DEFAULT_MAXCOLOR;
      var colorDomain = this.props.colorDomain || [1, 0];
      var _this$state2 = this.state,
          model = _this$state2.model,
          maxBuffer = _this$state2.maxBuffer,
          cellScale = _this$state2.cellScale,
          shouldUseMinMax = _this$state2.shouldUseMinMax,
          colorRange = _this$state2.colorRange,
          maxWeight = _this$state2.maxWeight;
      var layerUniforms = {
        minColor: minColor,
        maxColor: maxColor,
        cellScale: cellScale,
        colorRange: colorRange,
        colorDomain: colorDomain,
        shouldUseMinMax: shouldUseMinMax
      };

      if (isWebGL2(gl)) {
        maxBuffer.bind({
          target: 35345
        });
      } else {
        layerUniforms.maxWeight = maxWeight;
      }

      uniforms = Object.assign(layerUniforms, uniforms);
      model.draw({
        uniforms: uniforms,
        parameters: Object.assign({
          depthTest: false,
          depthMask: false
        }, parameters)
      });

      if (isWebGL2(gl)) {
        maxBuffer.unbind();
      }
    }
  }, {
    key: "calculateInstancePositions",
    value: function calculateInstancePositions(attribute, _ref3) {
      var numInstances = _ref3.numInstances;
      var _this$context$viewpor = this.context.viewport,
          width = _this$context$viewpor.width,
          height = _this$context$viewpor.height;
      var cellSizePixels = this.props.cellSizePixels;
      var numCol = this.state.numCol;
      var value = attribute.value,
          size = attribute.size;

      for (var i = 0; i < numInstances; i++) {
        var x = i % numCol;
        var y = Math.floor(i / numCol);
        value[i * size + 0] = x * cellSizePixels / width * 2 - 1;
        value[i * size + 1] = 1 - y * cellSizePixels / height * 2;
        value[i * size + 2] = 0;
      }
    }
  }, {
    key: "calculateInstanceCounts",
    value: function calculateInstanceCounts(attribute, _ref4) {
      var numInstances = _ref4.numInstances;
      var aggregationBuffer = this.state.aggregationBuffer;
      attribute.update({
        buffer: aggregationBuffer
      });
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref5) {
      var info = _ref5.info,
          mode = _ref5.mode;
      var index = info.index;

      if (index >= 0) {
        var gpuGridAggregator = this.state.gpuGridAggregator;
        var aggregationResults = gpuGridAggregator.getData('color');
        info.object = GPUGridAggregator.getAggregationData(Object.assign({
          pixelIndex: index
        }, aggregationResults));
      }

      return info;
    }
  }, {
    key: "_getAggregationChangeFlags",
    value: function _getAggregationChangeFlags(_ref6) {
      var oldProps = _ref6.oldProps,
          props = _ref6.props,
          changeFlags = _ref6.changeFlags;
      var cellSizeChanged = props.cellSizePixels !== oldProps.cellSizePixels || props.cellMarginPixels !== oldProps.cellMarginPixels;
      var dataChanged = changeFlags.dataChanged || props.aggregation !== oldProps.aggregation;
      var viewportChanged = changeFlags.viewportChanged;

      if (cellSizeChanged || dataChanged || viewportChanged) {
        return {
          cellSizeChanged: cellSizeChanged,
          dataChanged: dataChanged,
          viewportChanged: viewportChanged
        };
      }

      return null;
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: 6,
          attributes: {
            positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "_getMaxCountBuffer",
    value: function _getMaxCountBuffer(gl) {
      return new Buffer(gl, {
        byteLength: 4 * 4,
        index: AGGREGATION_DATA_UBO_INDEX,
        accessor: {
          size: 4
        }
      });
    }
  }, {
    key: "_processData",
    value: function _processData() {
      var _this$props = this.props,
          data = _this$props.data,
          getPosition = _this$props.getPosition,
          getWeight = _this$props.getWeight;
      var pointCount = count(data);
      var positions = new Float64Array(pointCount * 2);
      var colorWeights = new Float32Array(pointCount * 3);
      var weights = this.state.weights;

      var _createIterable = createIterable(data),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;
          var position = getPosition(object, objectInfo);
          var weight = getWeight(object, objectInfo);
          var index = objectInfo.index;
          positions[index * 2] = position[0];
          positions[index * 2 + 1] = position[1];

          if (Array.isArray(weight)) {
            colorWeights[index * 3] = weight[0];
            colorWeights[index * 3 + 1] = weight[1];
            colorWeights[index * 3 + 2] = weight[2];
          } else {
            colorWeights[index * 3] = weight;
          }
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

      weights.color.values = colorWeights;
      this.setState({
        positions: positions
      });
    }
  }, {
    key: "_setupUniformBuffer",
    value: function _setupUniformBuffer() {
      var gl = this.context.gl;

      if (!isWebGL2(gl)) {
        return;
      }

      var programHandle = this.state.model.program.handle;
      var uniformBlockIndex = gl.getUniformBlockIndex(programHandle, 'AggregationData');
      gl.uniformBlockBinding(programHandle, uniformBlockIndex, AGGREGATION_DATA_UBO_INDEX);
    }
  }, {
    key: "_shouldUseMinMax",
    value: function _shouldUseMinMax() {
      var _this$props2 = this.props,
          minColor = _this$props2.minColor,
          maxColor = _this$props2.maxColor,
          colorDomain = _this$props2.colorDomain,
          colorRange = _this$props2.colorRange;

      if (minColor || maxColor) {
        log.deprecated('ScreenGridLayer props: minColor and maxColor', 'colorRange, colorDomain')();
        return true;
      }

      if (colorDomain || colorRange) {
        return false;
      }

      return true;
    }
  }, {
    key: "_updateAggregation",
    value: function _updateAggregation(changeFlags) {
      var attributeManager = this.getAttributeManager();

      if (changeFlags.cellSizeChanged || changeFlags.viewportChanged) {
        this._updateGridParams();

        attributeManager.invalidateAll();
      }

      var _this$props3 = this.props,
          cellSizePixels = _this$props3.cellSizePixels,
          gpuAggregation = _this$props3.gpuAggregation;
      var _this$state3 = this.state,
          positions = _this$state3.positions,
          weights = _this$state3.weights;
      var viewport = this.context.viewport;
      weights.color.operation = AGGREGATION_OPERATION[this.props.aggregation.toUpperCase()] || AGGREGATION_OPERATION.SUM;
      var projectPoints = false;
      var gridTransformMatrix = null;

      if (this.context.viewport instanceof WebMercatorViewport) {
        projectPoints = true;
      } else {
        projectPoints = false;
        gridTransformMatrix = viewport.pixelProjectionMatrix;
      }

      var results = this.state.gpuGridAggregator.run({
        positions: positions,
        weights: weights,
        cellSize: [cellSizePixels, cellSizePixels],
        viewport: viewport,
        changeFlags: changeFlags,
        useGPU: gpuAggregation,
        projectPoints: projectPoints,
        gridTransformMatrix: gridTransformMatrix
      });
      var maxWeight = results.color.maxData && Number.isFinite(results.color.maxData[0]) ? results.color.maxData[0] : 0;
      this.setState({
        maxWeight: maxWeight
      });
      attributeManager.invalidate('instanceCounts');
    }
  }, {
    key: "_updateUniforms",
    value: function _updateUniforms(_ref7) {
      var oldProps = _ref7.oldProps,
          props = _ref7.props,
          changeFlags = _ref7.changeFlags;
      var newState = {};

      if (COLOR_PROPS.some(function (key) {
        return oldProps[key] !== props[key];
      })) {
        newState.shouldUseMinMax = this._shouldUseMinMax();
      }

      if (oldProps.colorRange !== props.colorRange) {
        newState.colorRange = colorRangeToFlatArray(props.colorRange, Float32Array, 255);
      }

      if (oldProps.cellMarginPixels !== props.cellMarginPixels || oldProps.cellSizePixels !== props.cellSizePixels || changeFlags.viewportChanged) {
        var _this$context$viewpor2 = this.context.viewport,
            width = _this$context$viewpor2.width,
            height = _this$context$viewpor2.height;
        var _this$props4 = this.props,
            cellSizePixels = _this$props4.cellSizePixels,
            cellMarginPixels = _this$props4.cellMarginPixels;
        var margin = cellSizePixels > cellMarginPixels ? cellMarginPixels : 0;
        newState.cellScale = new Float32Array([(cellSizePixels - margin) / width * 2, -(cellSizePixels - margin) / height * 2, 1]);
      }

      this.setState(newState);
    }
  }, {
    key: "_updateGridParams",
    value: function _updateGridParams() {
      var _this$context$viewpor3 = this.context.viewport,
          width = _this$context$viewpor3.width,
          height = _this$context$viewpor3.height;
      var cellSizePixels = this.props.cellSizePixels;
      var gl = this.context.gl;
      var numCol = Math.ceil(width / cellSizePixels);
      var numRow = Math.ceil(height / cellSizePixels);
      var numInstances = numCol * numRow;
      var dataBytes = numInstances * 4 * 4;
      var aggregationBuffer = this.state.aggregationBuffer;

      if (aggregationBuffer) {
        aggregationBuffer.delete();
      }

      aggregationBuffer = new Buffer(gl, {
        byteLength: dataBytes,
        accessor: {
          size: 4,
          type: 5126,
          divisor: 1
        }
      });
      this.state.weights.color.aggregationBuffer = aggregationBuffer;
      this.setState({
        numCol: numCol,
        numRow: numRow,
        numInstances: numInstances,
        aggregationBuffer: aggregationBuffer
      });
    }
  }]);

  return ScreenGridLayer;
}(Layer);

export { ScreenGridLayer as default };
ScreenGridLayer.layerName = 'ScreenGridLayer';
ScreenGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=screen-grid-layer.js.map