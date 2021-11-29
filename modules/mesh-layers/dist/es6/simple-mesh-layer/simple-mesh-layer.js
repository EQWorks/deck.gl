import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry, Texture2D, fp64, PhongMaterial, isWebGL2 } from '@luma.gl/core';
import { load } from '@loaders.gl/core';
import { loadImage } from '@loaders.gl/images';
const fp64LowPart = fp64.fp64LowPart;
import { MATRIX_ATTRIBUTES } from '../utils/matrix';
import vs1 from './simple-mesh-layer-vertex.glsl1';
import fs1 from './simple-mesh-layer-fragment.glsl1';
import vs3 from './simple-mesh-layer-vertex.glsl';
import fs3 from './simple-mesh-layer-fragment.glsl';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`deck.gl: ${message}`);
  }
}

function getTexture(gl, src, opts) {
  if (typeof src === 'string') {
    return loadImage(src).then(data => getTextureFromData(gl, data, opts)).catch(error => {
      throw new Error(`Could not load texture from ${src}: ${error}`);
    });
  }

  return new Promise(resolve => resolve(getTextureFromData(gl, src, opts)));
}

function getTextureFromData(gl, data, opts) {
  if (data instanceof Texture2D) {
    return data;
  }

  return new Texture2D(gl, Object.assign({
    data
  }, opts));
}

function validateGeometryAttributes(attributes) {
  assert(attributes.positions || attributes.POSITION, 'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.');
}

function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);

    if (data instanceof Geometry) {
      return data;
    } else {
      return new Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new Geometry({
      attributes: data
    });
  }

  throw Error('Invalid mesh');
}

const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  fetch: function (_fetch) {
    function fetch(_x, _x2) {
      return _fetch.apply(this, arguments);
    }

    fetch.toString = function () {
      return _fetch.toString();
    };

    return fetch;
  }((url, _ref) => {
    let propName = _ref.propName;

    if (propName === 'mesh') {
      return load(url);
    }

    return fetch(url).then(response => response.json());
  }),
  mesh: {
    value: null,
    type: 'object',
    async: true
  },
  texture: null,
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  parameters: {
    depthTest: true,
    depthFunc: 515
  },
  fp64: false,
  wireframe: false,
  material: defaultMaterial,
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getOrientation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getScale: {
    type: 'accessor',
    value: [1, 1, 1]
  },
  getTranslation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getTransformMatrix: {
    type: 'accessor',
    value: []
  }
};
export default class SimpleMeshLayer extends Layer {
  getShaders() {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    const gl2 = isWebGL2(this.context.gl);
    const vs = gl2 ? vs3 : vs1;
    const fs = gl2 ? fs3 : fs1;
    return {
      vs,
      fs,
      modules: [projectModule, 'phong-lighting', 'picking']
    };
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instancePositions: {
        transition: true,
        size: 3,
        accessor: 'getPosition'
      },
      instancePositions64xy: {
        size: 2,
        accessor: 'getPosition',
        update: this.calculateInstancePositions64xyLow
      },
      instanceColors: {
        transition: true,
        size: 4,
        accessor: 'getColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceModelMatrix: MATRIX_ATTRIBUTES
    });
    this.setState({
      emptyTexture: new Texture2D(this.context.gl, {
        data: new Uint8Array(4),
        width: 1,
        height: 1
      })
    });
  }

  updateState(_ref2) {
    let props = _ref2.props,
        oldProps = _ref2.oldProps,
        changeFlags = _ref2.changeFlags;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });

    if (props.mesh !== oldProps.mesh || props.fp64 !== oldProps.fp64) {
      if (this.state.model) {
        this.state.model.delete();
      }

      if (props.mesh) {
        this.setState({
          model: this.getModel(props.mesh)
        });
        const attributes = props.mesh.attributes || props.mesh;
        this.setState({
          hasNormals: Boolean(attributes.NORMAL || attributes.normals)
        });
      }

      this.getAttributeManager().invalidateAll();
    }

    if (props.texture !== oldProps.texture) {
      this.setTexture(props.texture);
    }

    if (this.state.model) {
      this.state.model.setDrawMode(this.props.wireframe ? 3 : 4);
    }
  }

  finalizeState() {
    super.finalizeState();
    this.state.emptyTexture.delete();

    if (this.state.texture) {
      this.state.texture.delete();
    }
  }

  draw(_ref3) {
    let uniforms = _ref3.uniforms;

    if (!this.state.model) {
      return;
    }

    const sizeScale = this.props.sizeScale;
    this.state.model.draw({
      uniforms: Object.assign({}, uniforms, {
        sizeScale,
        flatShade: !this.state.hasNormals
      })
    });
  }

  getModel(mesh) {
    const model = new Model(this.context.gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: getGeometry(mesh),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));

    if (this.state.texture) {
      model.setUniforms({
        sampler: this.state.texture,
        hasTexture: 1
      });
    } else {
      model.setUniforms({
        sampler: this.state.emptyTexture,
        hasTexture: 0
      });
    }

    return model;
  }

  setTexture(src) {
    const gl = this.context.gl;
    const emptyTexture = this.state.emptyTexture;

    if (this.state.texture) {
      this.state.texture.delete();
    }

    if (src) {
      getTexture(gl, src).then(texture => {
        this.setState({
          texture
        });

        if (this.state.model) {
          this.state.model.setUniforms({
            sampler: this.state.texture,
            hasTexture: 1
          });
        }
      });
    } else {
      this.setState({
        texture: null
      });

      if (this.state.model) {
        this.state.model.setUniforms({
          sampler: emptyTexture,
          hasTexture: 0
        });
      }
    }
  }

  calculateInstancePositions64xyLow(attribute, _ref4) {
    let startRow = _ref4.startRow,
        endRow = _ref4.endRow;
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(2);
      return;
    }

    const _this$props = this.props,
          data = _this$props.data,
          getPosition = _this$props.getPosition;
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
SimpleMeshLayer.layerName = 'SimpleMeshLayer';
SimpleMeshLayer.defaultProps = defaultProps;
//# sourceMappingURL=simple-mesh-layer.js.map