import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry, fp64 } from 'kepler-outdated-luma.gl-core';
const {
  fp64LowPart
} = fp64;
import vs from './scatterplot-layer-vertex.glsl';
import fs from './scatterplot-layer-fragment.glsl';
const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultProps = {
  radiusScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  radiusMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  radiusMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  lineWidthUnits: 'meters',
  lineWidthScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  lineWidthMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  lineWidthMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  stroked: false,
  fp64: false,
  filled: true,
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getRadius: {
    type: 'accessor',
    value: 1
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
  strokeWidth: {
    deprecatedFor: 'getLineWidth'
  },
  outline: {
    deprecatedFor: 'stroked'
  },
  getColor: {
    deprecatedFor: ['getFillColor', 'getLineColor']
  }
};
export default class ScatterplotLayer extends Layer {
  getShaders(id) {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs,
      fs,
      modules: [projectModule, 'picking']
    };
  }

  initializeState() {
    this.getAttributeManager().addInstanced({
      instancePositions: {
        size: 3,
        transition: true,
        accessor: 'getPosition'
      },
      instancePositions64xyLow: {
        size: 2,
        accessor: 'getPosition',
        update: this.calculateInstancePositions64xyLow
      },
      instanceRadius: {
        size: 1,
        transition: true,
        accessor: 'getRadius',
        defaultValue: 1
      },
      instanceFillColors: {
        size: 4,
        transition: true,
        type: 5121,
        accessor: 'getFillColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineColors: {
        size: 4,
        transition: true,
        type: 5121,
        accessor: 'getLineColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineWidths: {
        size: 1,
        transition: true,
        accessor: 'getLineWidth',
        defaultValue: 1
      }
    });
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });

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
      this.getAttributeManager().invalidateAll();
    }
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      viewport
    } = this.context;
    const {
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      stroked,
      filled,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels
    } = this.props;
    const widthMultiplier = lineWidthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      stroked: stroked ? 1 : 0,
      filled,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      lineWidthScale: lineWidthScale * widthMultiplier,
      lineWidthMinPixels,
      lineWidthMaxPixels
    })).draw();
  }

  _getModel(gl) {
    const positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];
    return new Model(gl, Object.assign(this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        vertexCount: 4,
        attributes: {
          positions: {
            size: 3,
            value: new Float32Array(positions)
          }
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  calculateInstancePositions64xyLow(attribute, _ref3) {
    let {
      startRow,
      endRow
    } = _ref3;
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(2);
      return;
    }

    const {
      data,
      getPosition
    } = this.props;
    const {
      value,
      size
    } = attribute;
    let i = startRow * size;
    const {
      iterable,
      objectInfo
    } = createIterable(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

}
ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps;
//# sourceMappingURL=scatterplot-layer.js.map