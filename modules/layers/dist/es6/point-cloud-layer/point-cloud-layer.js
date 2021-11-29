import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry, fp64, PhongMaterial } from '@luma.gl/core';
const fp64LowPart = fp64.fp64LowPart;
import vs from './point-cloud-layer-vertex.glsl';
import fs from './point-cloud-layer-fragment.glsl';
const DEFAULT_COLOR = [0, 0, 0, 255];
const DEFAULT_NORMAL = [0, 0, 1];
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  sizeUnits: 'pixels',
  pointSize: {
    type: 'number',
    min: 0,
    value: 10
  },
  fp64: false,
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getNormal: {
    type: 'accessor',
    value: DEFAULT_NORMAL
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  material: defaultMaterial,
  radiusPixels: {
    deprecatedFor: 'pointSize'
  }
};
export default class PointCloudLayer extends Layer {
  getShaders(id) {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs,
      fs,
      modules: [projectModule, 'gouraud-lighting', 'picking']
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
      instanceNormals: {
        size: 3,
        transition: true,
        accessor: 'getNormal',
        defaultValue: DEFAULT_NORMAL
      },
      instanceColors: {
        size: 4,
        type: 5121,
        transition: true,
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR
      }
    });
  }

  updateState(_ref) {
    let props = _ref.props,
        oldProps = _ref.oldProps,
        changeFlags = _ref.changeFlags;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });

    if (props.fp64 !== oldProps.fp64) {
      const gl = this.context.gl;

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
    let uniforms = _ref2.uniforms;
    const viewport = this.context.viewport;
    const _this$props = this.props,
          pointSize = _this$props.pointSize,
          sizeUnits = _this$props.sizeUnits;
    const sizeMultiplier = sizeUnits === 'meters' ? viewport.distanceScales.pixelsPerMeter[2] : 1;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      radiusPixels: pointSize * sizeMultiplier
    })).draw();
  }

  _getModel(gl) {
    const positions = [];

    for (let i = 0; i < 3; i++) {
      const angle = i / 3 * Math.PI * 2;
      positions.push(Math.cos(angle) * 2, Math.sin(angle) * 2, 0);
    }

    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 4,
        attributes: {
          positions: new Float32Array(positions)
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  calculateInstancePositions64xyLow(attribute, _ref3) {
    let startRow = _ref3.startRow,
        endRow = _ref3.endRow;
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(2);
      return;
    }

    const _this$props2 = this.props,
          data = _this$props2.data,
          getPosition = _this$props2.getPosition;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

}
PointCloudLayer.layerName = 'PointCloudLayer';
PointCloudLayer.defaultProps = defaultProps;
//# sourceMappingURL=point-cloud-layer.js.map