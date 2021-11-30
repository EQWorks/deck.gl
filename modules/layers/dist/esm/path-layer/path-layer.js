import { Layer } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry } from 'kepler-outdated-luma.gl-core';
import PathTesselator from './path-tesselator';
import vs from './path-layer-vertex.glsl';
import vs64 from './path-layer-vertex-64.glsl';
import fs from './path-layer-fragment.glsl';
const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultProps = {
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
    value: object => object.path
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
const ATTRIBUTE_TRANSITION = {
  enter: (value, chunk) => {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};
export default class PathLayer extends Layer {
  getShaders() {
    return this.use64bitProjection() ? {
      vs: vs64,
      fs,
      modules: ['project64', 'picking']
    } : {
      vs,
      fs,
      modules: ['project32', 'picking']
    };
  }

  initializeState() {
    const noAlloc = true;
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instanceStartPositions: {
        size: 3,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPath',
        update: this.calculateStartPositions,
        noAlloc
      },
      instanceEndPositions: {
        size: 3,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPath',
        update: this.calculateEndPositions,
        noAlloc
      },
      instanceStartEndPositions64xyLow: {
        size: 4,
        update: this.calculateInstanceStartEndPositions64xyLow,
        noAlloc
      },
      instanceLeftPositions: {
        size: 3,
        accessor: 'getPath',
        update: this.calculateLeftPositions,
        noAlloc
      },
      instanceRightPositions: {
        size: 3,
        accessor: 'getPath',
        update: this.calculateRightPositions,
        noAlloc
      },
      instanceNeighborPositions64xyLow: {
        size: 4,
        update: this.calculateInstanceNeighborPositions64xyLow,
        noAlloc
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
        accessor: (object, _ref) => {
          let {
            index,
            target: value
          } = _ref;
          return this.encodePickingColor(index, value);
        }
      }
    });
    this.setState({
      pathTesselator: new PathTesselator({})
    });
  }

  updateState(_ref2) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref2;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });
    const attributeManager = this.getAttributeManager();
    const geometryChanged = changeFlags.dataChanged || props.fp64 !== oldProps.fp64 || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath);

    if (geometryChanged) {
      const {
        pathTesselator
      } = this.state;
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
      const {
        gl
      } = this.context;

      if (this.state.model) {
        this.state.model.delete();
      }

      this.setState({
        model: this._getModel(gl)
      });
      attributeManager.invalidateAll();
    }
  }

  draw(_ref3) {
    let {
      uniforms
    } = _ref3;
    const {
      viewport
    } = this.context;
    const {
      rounded,
      billboard,
      miterLimit,
      widthUnits,
      widthScale,
      widthMinPixels,
      widthMaxPixels,
      dashJustified
    } = this.props;
    const widthMultiplier = widthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      jointType: Number(rounded),
      billboard,
      alignMode: Number(dashJustified),
      widthScale: widthScale * widthMultiplier,
      miterLimit,
      widthMinPixels,
      widthMaxPixels
    })).draw();
  }

  _getModel(gl) {
    const SEGMENT_INDICES = [0, 2, 1, 1, 2, 4, 1, 4, 3, 3, 4, 5];
    const SEGMENT_POSITIONS = [0, 0, 1, 0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0, 1, 0, 1];
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

  calculateStartPositions(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.bufferLayout = pathTesselator.bufferLayout;
    attribute.value = pathTesselator.get('startPositions');
  }

  calculateEndPositions(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.bufferLayout = pathTesselator.bufferLayout;
    attribute.value = pathTesselator.get('endPositions');
  }

  calculateInstanceStartEndPositions64xyLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (isFP64) {
      attribute.value = this.state.pathTesselator.get('startEndPositions64XyLow');
    } else {
      attribute.value = new Float32Array(4);
    }
  }

  calculateLeftPositions(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.value = pathTesselator.get('leftPositions');
  }

  calculateRightPositions(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.value = pathTesselator.get('rightPositions');
  }

  calculateInstanceNeighborPositions64xyLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (isFP64) {
      attribute.value = this.state.pathTesselator.get('neighborPositions64XyLow');
    } else {
      attribute.value = new Float32Array(4);
    }
  }

  clearPickingColor(color) {
    const pickedPathIndex = this.decodePickingColor(color);
    const {
      bufferLayout
    } = this.state.pathTesselator;
    const numVertices = bufferLayout[pickedPathIndex];
    let startInstanceIndex = 0;

    for (let pathIndex = 0; pathIndex < pickedPathIndex; pathIndex++) {
      startInstanceIndex += bufferLayout[pathIndex];
    }

    const {
      instancePickingColors
    } = this.getAttributeManager().attributes;
    const {
      value
    } = instancePickingColors;
    const endInstanceIndex = startInstanceIndex + numVertices;
    value.fill(0, startInstanceIndex * 3, endInstanceIndex * 3);
    instancePickingColors.update({
      value
    });
  }

}
PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=path-layer.js.map