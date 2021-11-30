import { Layer } from 'kepler-outdated-deck.gl-core';
import { Model, CubeGeometry, fp64, PhongMaterial } from 'kepler-outdated-luma.gl-core';
const {
  fp64LowPart
} = fp64;
const defaultMaterial = new PhongMaterial();
import { defaultColorRange } from '../utils/color-utils';
import vs from './gpu-grid-cell-layer-vertex.glsl';
import fs from './gpu-grid-cell-layer-fragment.glsl';
const COLOR_DATA_UBO_INDEX = 0;
const ELEVATION_DATA_UBO_INDEX = 1;
const defaultProps = {
  colorDomain: null,
  colorRange: defaultColorRange,
  elevationDomain: null,
  elevationRange: [0, 1000],
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  gridSize: {
    type: 'array',
    min: 0,
    value: [1, 1]
  },
  gridOrigin: {
    type: 'array',
    min: 0,
    value: [0, 0]
  },
  gridOffset: {
    type: 'array',
    min: 0,
    value: [0, 0]
  },
  cellSize: {
    type: 'number',
    min: 0,
    max: 1000,
    value: 1000
  },
  offset: {
    type: 'array',
    min: 0,
    value: [1, 1]
  },
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  extruded: true,
  fp64: false,
  material: defaultMaterial
};
export default class GPUGridCellLayer extends Layer {
  getShaders() {
    return {
      vs,
      fs,
      modules: ['project32', 'gouraud-lighting', 'picking', 'fp64']
    };
  }

  initializeState() {
    const {
      gl
    } = this.context;
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      colors: {
        size: 4,
        update: this.calculateColors,
        noAlloc: true
      },
      elevations: {
        size: 4,
        update: this.calculateElevations,
        noAlloc: true
      }
    });

    const model = this._getModel(gl);

    this._setupUniformBuffer(model);

    this.setState({
      model
    });
  }

  _getModel(gl) {
    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new CubeGeometry(),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  draw(_ref) {
    let {
      uniforms
    } = _ref;
    const {
      data,
      cellSize,
      offset,
      extruded,
      elevationScale,
      coverage,
      gridSize,
      gridOrigin,
      gridOffset,
      colorRange,
      elevationRange
    } = this.props;
    const gridOriginLow = [fp64LowPart(gridOrigin[0]), fp64LowPart(gridOrigin[1])];
    const gridOffsetLow = [fp64LowPart(gridOffset[0]), fp64LowPart(gridOffset[1])];
    const colorMaxMinBuffer = data.color.maxMinBuffer;
    const elevationMaxMinBuffer = data.elevation.maxMinBuffer;
    colorMaxMinBuffer.bind({
      target: 35345,
      index: COLOR_DATA_UBO_INDEX
    });
    elevationMaxMinBuffer.bind({
      target: 35345,
      index: ELEVATION_DATA_UBO_INDEX
    });
    const domainUniforms = this.getDomainUniforms();
    this.state.model.setUniforms(Object.assign({}, uniforms, domainUniforms, {
      cellSize,
      offset,
      extruded,
      elevationScale,
      coverage,
      gridSize,
      gridOrigin,
      gridOriginLow,
      gridOffset,
      gridOffsetLow,
      colorRange,
      elevationRange
    })).draw();
    colorMaxMinBuffer.unbind({
      target: 35345,
      index: COLOR_DATA_UBO_INDEX
    });
    elevationMaxMinBuffer.unbind({
      target: 35345,
      index: ELEVATION_DATA_UBO_INDEX
    });
  }

  calculateColors(attribute) {
    const {
      data
    } = this.props;
    attribute.update({
      buffer: data.color.aggregationBuffer
    });
  }

  calculateElevations(attribute) {
    const {
      data
    } = this.props;
    attribute.update({
      buffer: data.elevation.aggregationBuffer
    });
  }

  getDomainUniforms() {
    const {
      colorDomain,
      elevationDomain
    } = this.props;
    const domainUniforms = {};

    if (colorDomain !== null) {
      domainUniforms.colorDomainValid = true;
      domainUniforms.colorDomain = colorDomain;
    } else {
      domainUniforms.colorDomainValid = false;
    }

    if (elevationDomain !== null) {
      domainUniforms.elevationDomainValid = true;
      domainUniforms.elevationDomain = elevationDomain;
    } else {
      domainUniforms.elevationDomainValid = false;
    }

    return domainUniforms;
  }

  _setupUniformBuffer(model) {
    const gl = this.context.gl;
    const programHandle = model.program.handle;
    const colorIndex = gl.getUniformBlockIndex(programHandle, 'ColorData');
    const elevationIndex = gl.getUniformBlockIndex(programHandle, 'ElevationData');
    gl.uniformBlockBinding(programHandle, colorIndex, COLOR_DATA_UBO_INDEX);
    gl.uniformBlockBinding(programHandle, elevationIndex, ELEVATION_DATA_UBO_INDEX);
  }

}
GPUGridCellLayer.layerName = 'GPUGridCellLayer';
GPUGridCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=gpu-grid-cell-layer.js.map