import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Layer } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry } from '@luma.gl/core';
import PathTesselator from './path-tesselator';
import vs from './path-layer-vertex.glsl';
import vs64 from './path-layer-vertex-64.glsl';
import fs from './path-layer-fragment.glsl';
var DEFAULT_COLOR = [0, 0, 0, 255];
var defaultProps = {
  widthUnits: 'meters',
  widthScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  widthMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  widthMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  rounded: false,
  miterLimit: {
    type: 'number',
    min: 0,
    value: 4
  },
  fp64: false,
  dashJustified: false,
  billboard: false,
  getPath: {
    type: 'accessor',
    value: function value(object) {
      return object.path;
    }
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getWidth: {
    type: 'accessor',
    value: 1
  },
  getDashArray: {
    type: 'accessor',
    value: [0, 0]
  }
};
var ATTRIBUTE_TRANSITION = {
  enter: function enter(value, chunk) {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};

var PathLayer = function (_Layer) {
  _inherits(PathLayer, _Layer);

  function PathLayer() {
    _classCallCheck(this, PathLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(PathLayer).apply(this, arguments));
  }

  _createClass(PathLayer, [{
    key: "getShaders",
    value: function getShaders() {
      return this.use64bitProjection() ? {
        vs: vs64,
        fs: fs,
        modules: ['project64', 'picking']
      } : {
        vs: vs,
        fs: fs,
        modules: ['project32', 'picking']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var _this = this;

      var noAlloc = true;
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instanceStartPositions: {
          size: 3,
          transition: ATTRIBUTE_TRANSITION,
          accessor: 'getPath',
          update: this.calculateStartPositions,
          noAlloc: noAlloc
        },
        instanceEndPositions: {
          size: 3,
          transition: ATTRIBUTE_TRANSITION,
          accessor: 'getPath',
          update: this.calculateEndPositions,
          noAlloc: noAlloc
        },
        instanceStartEndPositions64xyLow: {
          size: 4,
          update: this.calculateInstanceStartEndPositions64xyLow,
          noAlloc: noAlloc
        },
        instanceLeftPositions: {
          size: 3,
          accessor: 'getPath',
          update: this.calculateLeftPositions,
          noAlloc: noAlloc
        },
        instanceRightPositions: {
          size: 3,
          accessor: 'getPath',
          update: this.calculateRightPositions,
          noAlloc: noAlloc
        },
        instanceNeighborPositions64xyLow: {
          size: 4,
          update: this.calculateInstanceNeighborPositions64xyLow,
          noAlloc: noAlloc
        },
        instanceStrokeWidths: {
          size: 1,
          accessor: 'getWidth',
          transition: ATTRIBUTE_TRANSITION,
          defaultValue: 1
        },
        instanceDashArrays: {
          size: 2,
          accessor: 'getDashArray'
        },
        instanceColors: {
          size: 4,
          type: 5121,
          accessor: 'getColor',
          transition: ATTRIBUTE_TRANSITION,
          defaultValue: DEFAULT_COLOR
        },
        instancePickingColors: {
          size: 3,
          type: 5121,
          accessor: function accessor(object, _ref) {
            var index = _ref.index,
                value = _ref.target;
            return _this.encodePickingColor(index, value);
          }
        }
      });
      this.setState({
        pathTesselator: new PathTesselator({})
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(_getPrototypeOf(PathLayer.prototype), "updateState", this).call(this, {
        props: props,
        oldProps: oldProps,
        changeFlags: changeFlags
      });

      var attributeManager = this.getAttributeManager();
      var geometryChanged = changeFlags.dataChanged || props.fp64 !== oldProps.fp64 || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath);

      if (geometryChanged) {
        var pathTesselator = this.state.pathTesselator;
        pathTesselator.updateGeometry({
          data: props.data,
          getGeometry: props.getPath,
          positionFormat: props.positionFormat,
          fp64: this.use64bitPositions()
        });
        this.setState({
          numInstances: pathTesselator.instanceCount,
          bufferLayout: pathTesselator.bufferLayout
        });
        attributeManager.invalidateAll();
      }

      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        if (this.state.model) {
          this.state.model.delete();
        }

        this.setState({
          model: this._getModel(gl)
        });
        attributeManager.invalidateAll();
      }
    }
  }, {
    key: "draw",
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var viewport = this.context.viewport;
      var _this$props = this.props,
          rounded = _this$props.rounded,
          billboard = _this$props.billboard,
          miterLimit = _this$props.miterLimit,
          widthUnits = _this$props.widthUnits,
          widthScale = _this$props.widthScale,
          widthMinPixels = _this$props.widthMinPixels,
          widthMaxPixels = _this$props.widthMaxPixels,
          dashJustified = _this$props.dashJustified;
      var widthMultiplier = widthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
      this.state.model.setUniforms(Object.assign({}, uniforms, {
        jointType: Number(rounded),
        billboard: billboard,
        alignMode: Number(dashJustified),
        widthScale: widthScale * widthMultiplier,
        miterLimit: miterLimit,
        widthMinPixels: widthMinPixels,
        widthMaxPixels: widthMaxPixels
      })).draw();
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      var SEGMENT_INDICES = [0, 2, 1, 1, 2, 4, 1, 4, 3, 3, 4, 5];
      var SEGMENT_POSITIONS = [0, 0, 1, 0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0, 1, 0, 1];
      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: 4,
          attributes: {
            indices: new Uint16Array(SEGMENT_INDICES),
            positions: new Float32Array(SEGMENT_POSITIONS)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "calculateStartPositions",
    value: function calculateStartPositions(attribute) {
      var pathTesselator = this.state.pathTesselator;
      attribute.bufferLayout = pathTesselator.bufferLayout;
      attribute.value = pathTesselator.get('startPositions');
    }
  }, {
    key: "calculateEndPositions",
    value: function calculateEndPositions(attribute) {
      var pathTesselator = this.state.pathTesselator;
      attribute.bufferLayout = pathTesselator.bufferLayout;
      attribute.value = pathTesselator.get('endPositions');
    }
  }, {
    key: "calculateInstanceStartEndPositions64xyLow",
    value: function calculateInstanceStartEndPositions64xyLow(attribute) {
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (isFP64) {
        attribute.value = this.state.pathTesselator.get('startEndPositions64XyLow');
      } else {
        attribute.value = new Float32Array(4);
      }
    }
  }, {
    key: "calculateLeftPositions",
    value: function calculateLeftPositions(attribute) {
      var pathTesselator = this.state.pathTesselator;
      attribute.value = pathTesselator.get('leftPositions');
    }
  }, {
    key: "calculateRightPositions",
    value: function calculateRightPositions(attribute) {
      var pathTesselator = this.state.pathTesselator;
      attribute.value = pathTesselator.get('rightPositions');
    }
  }, {
    key: "calculateInstanceNeighborPositions64xyLow",
    value: function calculateInstanceNeighborPositions64xyLow(attribute) {
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (isFP64) {
        attribute.value = this.state.pathTesselator.get('neighborPositions64XyLow');
      } else {
        attribute.value = new Float32Array(4);
      }
    }
  }, {
    key: "clearPickingColor",
    value: function clearPickingColor(color) {
      var pickedPathIndex = this.decodePickingColor(color);
      var bufferLayout = this.state.pathTesselator.bufferLayout;
      var numVertices = bufferLayout[pickedPathIndex];
      var startInstanceIndex = 0;

      for (var pathIndex = 0; pathIndex < pickedPathIndex; pathIndex++) {
        startInstanceIndex += bufferLayout[pathIndex];
      }

      var instancePickingColors = this.getAttributeManager().attributes.instancePickingColors;
      var value = instancePickingColors.value;
      var endInstanceIndex = startInstanceIndex + numVertices;
      value.fill(0, startInstanceIndex * 3, endInstanceIndex * 3);
      instancePickingColors.update({
        value: value
      });
    }
  }]);

  return PathLayer;
}(Layer);

export { PathLayer as default };
PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=path-layer.js.map