"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _core = require("@loaders.gl/core");

var _images = require("@loaders.gl/images");

var _matrix = require("../utils/matrix");

var _simpleMeshLayerVertex = _interopRequireDefault(require("./simple-mesh-layer-vertex.glsl1"));

var _simpleMeshLayerFragment = _interopRequireDefault(require("./simple-mesh-layer-fragment.glsl1"));

var _simpleMeshLayerVertex2 = _interopRequireDefault(require("./simple-mesh-layer-vertex.glsl"));

var _simpleMeshLayerFragment2 = _interopRequireDefault(require("./simple-mesh-layer-fragment.glsl"));

const {
  fp64LowPart
} = _keplerOutdatedLuma.fp64;

function assert(condition, message) {
  if (!condition) {
    throw new Error("deck.gl: ".concat(message));
  }
}

function getTexture(gl, src, opts) {
  if (typeof src === 'string') {
    return (0, _images.loadImage)(src).then(data => getTextureFromData(gl, data, opts)).catch(error => {
      throw new Error("Could not load texture from ".concat(src, ": ").concat(error));
    });
  }

  return new Promise(resolve => resolve(getTextureFromData(gl, src, opts)));
}

function getTextureFromData(gl, data, opts) {
  if (data instanceof _keplerOutdatedLuma.Texture2D) {
    return data;
  }

  return new _keplerOutdatedLuma.Texture2D(gl, Object.assign({
    data
  }, opts));
}

function validateGeometryAttributes(attributes) {
  assert(attributes.positions || attributes.POSITION, 'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.');
}

function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);

    if (data instanceof _keplerOutdatedLuma.Geometry) {
      return data;
    } else {
      return new _keplerOutdatedLuma.Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new _keplerOutdatedLuma.Geometry({
      attributes: data
    });
  }

  throw Error('Invalid mesh');
}

const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultMaterial = new _keplerOutdatedLuma.PhongMaterial();
const defaultProps = {
  fetch: (url, _ref) => {
    let {
      propName
    } = _ref;

    if (propName === 'mesh') {
      return (0, _core.load)(url);
    }

    return fetch(url).then(response => response.json());
  },
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

class SimpleMeshLayer extends _keplerOutdatedDeck.Layer {
  getShaders() {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    const gl2 = (0, _keplerOutdatedLuma.isWebGL2)(this.context.gl);
    const vs = gl2 ? _simpleMeshLayerVertex2.default : _simpleMeshLayerVertex.default;
    const fs = gl2 ? _simpleMeshLayerFragment2.default : _simpleMeshLayerFragment.default;
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
      instanceModelMatrix: _matrix.MATRIX_ATTRIBUTES
    });
    this.setState({
      emptyTexture: new _keplerOutdatedLuma.Texture2D(this.context.gl, {
        data: new Uint8Array(4),
        width: 1,
        height: 1
      })
    });
  }

  updateState(_ref2) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref2;
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
    let {
      uniforms
    } = _ref3;

    if (!this.state.model) {
      return;
    }

    const {
      sizeScale
    } = this.props;
    this.state.model.draw({
      uniforms: Object.assign({}, uniforms, {
        sizeScale,
        flatShade: !this.state.hasNormals
      })
    });
  }

  getModel(mesh) {
    const model = new _keplerOutdatedLuma.Model(this.context.gl, Object.assign({}, this.getShaders(), {
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
    const {
      gl
    } = this.context;
    const {
      emptyTexture
    } = this.state;

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
    let {
      startRow,
      endRow
    } = _ref4;
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
    } = (0, _keplerOutdatedDeck.createIterable)(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

}

exports.default = SimpleMeshLayer;
SimpleMeshLayer.layerName = 'SimpleMeshLayer';
SimpleMeshLayer.defaultProps = defaultProps;
//# sourceMappingURL=simple-mesh-layer.js.map