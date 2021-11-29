import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { Model, fp64, PhongMaterial } from '@luma.gl/core';
import ColumnGeometry from './column-geometry';
var fp64LowPart = fp64.fp64LowPart;
var defaultMaterial = new PhongMaterial();
import vs from './column-layer-vertex.glsl';
import fs from './column-layer-fragment.glsl';
var DEFAULT_COLOR = [0, 0, 0, 255];
var defaultProps = {
  diskResolution: {
    type: 'number',
    min: 4,
    value: 20
  },
  vertices: null,
  radius: {
    type: 'number',
    min: 0,
    value: 1000
  },
  angle: {
    type: 'number',
    value: 0
  },
  offset: {
    type: 'array',
    value: [0, 0]
  },
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  extruded: true,
  fp64: false,
  wireframe: false,
  filled: true,
  stroked: false,
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getFillColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getLineColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  material: defaultMaterial,
  getColor: {
    deprecatedFor: ['getFillColor', 'getLineColor']
  }
};

var ColumnLayer = function (_Layer) {
  _inherits(ColumnLayer, _Layer);

  function ColumnLayer() {
    _classCallCheck(this, ColumnLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(ColumnLayer).apply(this, arguments));
  }

  _createClass(ColumnLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var projectModule = this.use64bitProjection() ? 'project64' : 'project32';
      return {
        vs: vs,
        fs: fs,
        modules: [projectModule, 'gouraud-lighting', 'picking']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: 'getPosition'
        },
        instanceElevations: {
          size: 1,
          transition: true,
          accessor: 'getElevation'
        },
        instancePositions64xyLow: {
          size: 2,
          accessor: 'getPosition',
          update: this.calculateInstancePositions64xyLow
        },
        instanceFillColors: {
          size: 4,
          type: 5121,
          transition: true,
          accessor: 'getFillColor',
          defaultValue: DEFAULT_COLOR
        },
        instanceLineColors: {
          size: 4,
          type: 5121,
          transition: true,
          accessor: 'getLineColor',
          defaultValue: DEFAULT_COLOR
        },
        instanceStrokeWidths: {
          size: 1,
          accessor: 'getLineWidth',
          transition: true
        }
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      _get(_getPrototypeOf(ColumnLayer.prototype), "updateState", this).call(this, {
        props: props,
        oldProps: oldProps,
        changeFlags: changeFlags
      });

      var regenerateModels = props.fp64 !== oldProps.fp64;

      if (regenerateModels) {
        var gl = this.context.gl;

        if (this.state.model) {
          this.state.model.delete();
        }

        this.setState({
          model: this._getModel(gl)
        });
        this.getAttributeManager().invalidateAll();
      }

      if (regenerateModels || props.diskResolution !== oldProps.diskResolution || props.vertices !== oldProps.vertices) {
        this._updateGeometry(props);
      }
    }
  }, {
    key: "getGeometry",
    value: function getGeometry(diskResolution, vertices) {
      var geometry = new ColumnGeometry({
        radius: 1,
        height: 2,
        vertices: vertices,
        nradial: diskResolution
      });
      var meanVertexDistance = 0;

      if (vertices) {
        for (var i = 0; i < diskResolution; i++) {
          var p = vertices[i];
          var d = Math.sqrt(p[0] * p[0] + p[1] * p[1]);
          meanVertexDistance += d / diskResolution;
        }
      } else {
        meanVertexDistance = 1;
      }

      this.setState({
        edgeDistance: Math.cos(Math.PI / diskResolution) * meanVertexDistance
      });
      return geometry;
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "_updateGeometry",
    value: function _updateGeometry(_ref2) {
      var diskResolution = _ref2.diskResolution,
          vertices = _ref2.vertices;
      var geometry = this.getGeometry(diskResolution, vertices);
      this.setState({
        fillVertexCount: geometry.attributes.POSITION.value.length / 3,
        wireframeVertexCount: geometry.indices.value.length
      });
      this.state.model.setProps({
        geometry: geometry
      });
    }
  }, {
    key: "draw",
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var viewport = this.context.viewport;
      var _this$props = this.props,
          lineWidthUnits = _this$props.lineWidthUnits,
          lineWidthScale = _this$props.lineWidthScale,
          lineWidthMinPixels = _this$props.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props.lineWidthMaxPixels,
          elevationScale = _this$props.elevationScale,
          extruded = _this$props.extruded,
          filled = _this$props.filled,
          stroked = _this$props.stroked,
          wireframe = _this$props.wireframe,
          offset = _this$props.offset,
          coverage = _this$props.coverage,
          radius = _this$props.radius,
          angle = _this$props.angle;
      var _this$state = this.state,
          model = _this$state.model,
          fillVertexCount = _this$state.fillVertexCount,
          wireframeVertexCount = _this$state.wireframeVertexCount,
          edgeDistance = _this$state.edgeDistance;
      var widthMultiplier = lineWidthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
      model.setUniforms(Object.assign({}, uniforms, {
        radius: radius,
        angle: angle / 180 * Math.PI,
        offset: offset,
        extruded: extruded,
        coverage: coverage,
        elevationScale: elevationScale,
        edgeDistance: edgeDistance,
        widthScale: lineWidthScale * widthMultiplier,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels
      }));

      if (extruded && wireframe) {
        model.setProps({
          isIndexed: true
        });
        model.setVertexCount(wireframeVertexCount).setDrawMode(1).setUniforms({
          isStroke: true
        }).draw();
      }

      if (filled) {
        model.setProps({
          isIndexed: false
        });
        model.setVertexCount(fillVertexCount).setDrawMode(5).setUniforms({
          isStroke: false
        }).draw();
      }

      if (!extruded && stroked) {
        model.setProps({
          isIndexed: false
        });
        model.setVertexCount(fillVertexCount * 2 / 3).setDrawMode(5).setUniforms({
          isStroke: true
        }).draw();
      }
    }
  }, {
    key: "calculateInstancePositions64xyLow",
    value: function calculateInstancePositions64xyLow(attribute, _ref4) {
      var startRow = _ref4.startRow,
          endRow = _ref4.endRow;
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(2);
        return;
      }

      var _this$props2 = this.props,
          data = _this$props2.data,
          getPosition = _this$props2.getPosition;
      var value = attribute.value,
          size = attribute.size;
      var i = startRow * size;

      var _createIterable = createIterable(data, startRow, endRow),
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
          value[i++] = fp64LowPart(position[0]);
          value[i++] = fp64LowPart(position[1]);
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
    }
  }]);

  return ColumnLayer;
}(Layer);

export { ColumnLayer as default };
ColumnLayer.layerName = 'ColumnLayer';
ColumnLayer.defaultProps = defaultProps;
//# sourceMappingURL=column-layer.js.map