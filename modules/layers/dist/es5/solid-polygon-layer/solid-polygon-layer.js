"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _core = require("@luma.gl/core");

var _polygonTesselator = _interopRequireDefault(require("./polygon-tesselator"));

var _solidPolygonLayerVertexTop = _interopRequireDefault(require("./solid-polygon-layer-vertex-top.glsl"));

var _solidPolygonLayerVertexSide = _interopRequireDefault(require("./solid-polygon-layer-vertex-side.glsl"));

var _solidPolygonLayerFragment = _interopRequireDefault(require("./solid-polygon-layer-fragment.glsl"));

const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultMaterial = new _core.PhongMaterial();
const defaultProps = {
  filled: true,
  extruded: false,
  wireframe: false,
  fp64: false,
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  getPolygon: {
    type: 'accessor',
    value: f => f.polygon
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  getFillColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getLineColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  material: defaultMaterial
};
const ATTRIBUTE_TRANSITION = {
  enter: (value, chunk) => {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};

class SolidPolygonLayer extends _keplerOutdatedDeck.Layer {
  getShaders(vs) {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs,
      fs: _solidPolygonLayerFragment.default,
      modules: [projectModule, 'gouraud-lighting', 'picking']
    };
  }

  initializeState() {
    const {
      gl
    } = this.context;
    this.setState({
      numInstances: 0,
      polygonTesselator: new _polygonTesselator.default({
        IndexType: !gl || (0, _core.hasFeature)(gl, _core.FEATURES.ELEMENT_INDEX_UINT32) ? Uint32Array : Uint16Array
      })
    });
    const attributeManager = this.getAttributeManager();
    const noAlloc = true;
    attributeManager.remove(['instancePickingColors']);
    attributeManager.add({
      indices: {
        size: 1,
        isIndexed: true,
        update: this.calculateIndices,
        noAlloc
      },
      positions: {
        size: 3,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPolygon',
        update: this.calculatePositions,
        noAlloc,
        shaderAttributes: {
          positions: {
            offset: 0,
            divisor: 0
          },
          instancePositions: {
            offset: 0,
            divisor: 1
          },
          nextPositions: {
            offset: 12,
            divisor: 1
          }
        }
      },
      positions64xyLow: {
        size: 2,
        update: this.calculatePositionsLow,
        noAlloc,
        shaderAttributes: {
          positions64xyLow: {
            offset: 0,
            divisor: 0
          },
          instancePositions64xyLow: {
            offset: 0,
            divisor: 1
          },
          nextPositions64xyLow: {
            offset: 8,
            divisor: 1
          }
        }
      },
      vertexValid: {
        size: 1,
        divisor: 1,
        type: 5121,
        update: this.calculateVertexValid,
        noAlloc
      },
      elevations: {
        size: 1,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getElevation',
        shaderAttributes: {
          elevations: {
            divisor: 0
          },
          instanceElevations: {
            divisor: 1
          }
        }
      },
      fillColors: {
        alias: 'colors',
        size: 4,
        type: 5121,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getFillColor',
        defaultValue: DEFAULT_COLOR,
        shaderAttributes: {
          fillColors: {
            divisor: 0
          },
          instanceFillColors: {
            divisor: 1
          }
        }
      },
      lineColors: {
        alias: 'colors',
        size: 4,
        type: 5121,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getLineColor',
        defaultValue: DEFAULT_COLOR,
        shaderAttributes: {
          lineColors: {
            divisor: 0
          },
          instanceLineColors: {
            divisor: 1
          }
        }
      },
      pickingColors: {
        size: 3,
        type: 5121,
        accessor: (object, _ref) => {
          let {
            index,
            target: value
          } = _ref;
          return this.encodePickingColor(index, value);
        },
        shaderAttributes: {
          pickingColors: {
            divisor: 0
          },
          instancePickingColors: {
            divisor: 1
          }
        }
      }
    });
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      extruded,
      filled,
      wireframe,
      elevationScale
    } = this.props;
    const {
      topModel,
      sideModel,
      polygonTesselator
    } = this.state;
    const renderUniforms = Object.assign({}, uniforms, {
      extruded: Boolean(extruded),
      elevationScale
    });

    if (sideModel) {
      sideModel.setInstanceCount(polygonTesselator.instanceCount - 1);
      sideModel.setUniforms(renderUniforms);

      if (wireframe) {
        sideModel.setDrawMode(3);
        sideModel.setUniforms({
          isWireframe: true
        }).draw();
      }

      if (filled) {
        sideModel.setDrawMode(6);
        sideModel.setUniforms({
          isWireframe: false
        }).draw();
      }
    }

    if (topModel) {
      topModel.setVertexCount(polygonTesselator.get('indices').length);
      topModel.setUniforms(renderUniforms).draw();
    }
  }

  updateState(updateParams) {
    super.updateState(updateParams);
    this.updateGeometry(updateParams);
    const {
      props,
      oldProps
    } = updateParams;
    const attributeManager = this.getAttributeManager();
    const regenerateModels = props.fp64 !== oldProps.fp64 || props.filled !== oldProps.filled || props.extruded !== oldProps.extruded;

    if (regenerateModels) {
      if (this.state.models) {
        this.state.models.forEach(model => model.delete());
      }

      this.setState(this._getModels(this.context.gl));
      attributeManager.invalidateAll();
    }
  }

  updateGeometry(_ref3) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref3;
    const geometryConfigChanged = changeFlags.dataChanged || props.fp64 !== oldProps.fp64 || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

    if (geometryConfigChanged) {
      const {
        polygonTesselator
      } = this.state;
      polygonTesselator.updateGeometry({
        data: props.data,
        getGeometry: props.getPolygon,
        positionFormat: props.positionFormat,
        fp64: this.use64bitPositions()
      });
      this.setState({
        numInstances: polygonTesselator.instanceCount,
        bufferLayout: polygonTesselator.bufferLayout
      });
      this.getAttributeManager().invalidateAll();
    }
  }

  _getModels(gl) {
    const {
      id,
      filled,
      extruded
    } = this.props;
    let topModel;
    let sideModel;

    if (filled) {
      topModel = new _core.Model(gl, Object.assign({}, this.getShaders(_solidPolygonLayerVertexTop.default), {
        id: "".concat(id, "-top"),
        drawMode: 4,
        attributes: {
          vertexPositions: new Float32Array([0, 1])
        },
        uniforms: {
          isWireframe: false,
          isSideVertex: false
        },
        vertexCount: 0,
        isIndexed: true,
        shaderCache: this.context.shaderCache
      }));
    }

    if (extruded) {
      sideModel = new _core.Model(gl, Object.assign({}, this.getShaders(_solidPolygonLayerVertexSide.default), {
        id: "".concat(id, "-side"),
        geometry: new _core.Geometry({
          drawMode: 1,
          vertexCount: 4,
          attributes: {
            vertexPositions: {
              size: 2,
              value: new Float32Array([1, 1, 0, 1, 0, 0, 1, 0])
            }
          }
        }),
        instanceCount: 0,
        isInstanced: 1,
        shaderCache: this.context.shaderCache
      }));
      sideModel.userData.excludeAttributes = {
        indices: true
      };
    }

    return {
      models: [sideModel, topModel].filter(Boolean),
      topModel,
      sideModel
    };
  }

  calculateIndices(attribute) {
    const {
      polygonTesselator
    } = this.state;
    attribute.bufferLayout = polygonTesselator.indexLayout;
    attribute.value = polygonTesselator.get('indices');
  }

  calculatePositions(attribute) {
    const {
      polygonTesselator
    } = this.state;
    attribute.bufferLayout = polygonTesselator.bufferLayout;
    attribute.value = polygonTesselator.get('positions');
  }

  calculatePositionsLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(2);
      return;
    }

    attribute.value = this.state.polygonTesselator.get('positions64xyLow');
  }

  calculateVertexValid(attribute) {
    attribute.value = this.state.polygonTesselator.get('vertexValid');
  }

  clearPickingColor(color) {
    const pickedPolygonIndex = this.decodePickingColor(color);
    const {
      bufferLayout
    } = this.state.polygonTesselator;
    const numVertices = bufferLayout[pickedPolygonIndex];
    let startInstanceIndex = 0;

    for (let polygonIndex = 0; polygonIndex < pickedPolygonIndex; polygonIndex++) {
      startInstanceIndex += bufferLayout[polygonIndex];
    }

    const {
      pickingColors
    } = this.getAttributeManager().attributes;
    const {
      value
    } = pickingColors;
    const endInstanceIndex = startInstanceIndex + numVertices;
    value.fill(0, startInstanceIndex * 3, endInstanceIndex * 3);
    pickingColors.update({
      value
    });
  }

}

exports.default = SolidPolygonLayer;
SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=solid-polygon-layer.js.map