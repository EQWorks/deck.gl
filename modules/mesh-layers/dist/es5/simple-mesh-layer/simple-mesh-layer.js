"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _core = require("@luma.gl/core");

var _core2 = require("@loaders.gl/core");

var _images = require("@loaders.gl/images");

var _matrix = require("../utils/matrix");

var _simpleMeshLayerVertex = _interopRequireDefault(require("./simple-mesh-layer-vertex.glsl1"));

var _simpleMeshLayerFragment = _interopRequireDefault(require("./simple-mesh-layer-fragment.glsl1"));

var _simpleMeshLayerVertex2 = _interopRequireDefault(require("./simple-mesh-layer-vertex.glsl"));

var _simpleMeshLayerFragment2 = _interopRequireDefault(require("./simple-mesh-layer-fragment.glsl"));

var fp64LowPart = _core.fp64.fp64LowPart;

function assert(condition, message) {
  if (!condition) {
    throw new Error("deck.gl: ".concat(message));
  }
}

function getTexture(gl, src, opts) {
  if (typeof src === 'string') {
    return (0, _images.loadImage)(src).then(function (data) {
      return getTextureFromData(gl, data, opts);
    }).catch(function (error) {
      throw new Error("Could not load texture from ".concat(src, ": ").concat(error));
    });
  }

  return new Promise(function (resolve) {
    return resolve(getTextureFromData(gl, src, opts));
  });
}

function getTextureFromData(gl, data, opts) {
  if (data instanceof _core.Texture2D) {
    return data;
  }

  return new _core.Texture2D(gl, Object.assign({
    data: data
  }, opts));
}

function validateGeometryAttributes(attributes) {
  assert(attributes.positions || attributes.POSITION, 'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.');
}

function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);

    if (data instanceof _core.Geometry) {
      return data;
    } else {
      return new _core.Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new _core.Geometry({
      attributes: data
    });
  }

  throw Error('Invalid mesh');
}

var DEFAULT_COLOR = [0, 0, 0, 255];
var defaultMaterial = new _core.PhongMaterial();
var defaultProps = {
  fetch: function (_fetch) {
    function fetch(_x, _x2) {
      return _fetch.apply(this, arguments);
    }

    fetch.toString = function () {
      return _fetch.toString();
    };

    return fetch;
  }(function (url, _ref) {
    var propName = _ref.propName;

    if (propName === 'mesh') {
      return (0, _core2.load)(url);
    }

    return fetch(url).then(function (response) {
      return response.json();
    });
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
    value: function value(x) {
      return x.position;
    }
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

var SimpleMeshLayer = function (_Layer) {
  (0, _inherits2.default)(SimpleMeshLayer, _Layer);

  function SimpleMeshLayer() {
    (0, _classCallCheck2.default)(this, SimpleMeshLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(SimpleMeshLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(SimpleMeshLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var projectModule = this.use64bitProjection() ? 'project64' : 'project32';
      var gl2 = (0, _core.isWebGL2)(this.context.gl);
      var vs = gl2 ? _simpleMeshLayerVertex2.default : _simpleMeshLayerVertex.default;
      var fs = gl2 ? _simpleMeshLayerFragment2.default : _simpleMeshLayerFragment.default;
      return {
        vs: vs,
        fs: fs,
        modules: [projectModule, 'phong-lighting', 'picking']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
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
        emptyTexture: new _core.Texture2D(this.context.gl, {
          data: new Uint8Array(4),
          width: 1,
          height: 1
        })
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;
      (0, _get2.default)((0, _getPrototypeOf2.default)(SimpleMeshLayer.prototype), "updateState", this).call(this, {
        props: props,
        oldProps: oldProps,
        changeFlags: changeFlags
      });

      if (props.mesh !== oldProps.mesh || props.fp64 !== oldProps.fp64) {
        if (this.state.model) {
          this.state.model.delete();
        }

        if (props.mesh) {
          this.setState({
            model: this.getModel(props.mesh)
          });
          var attributes = props.mesh.attributes || props.mesh;
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
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(SimpleMeshLayer.prototype), "finalizeState", this).call(this);
      this.state.emptyTexture.delete();

      if (this.state.texture) {
        this.state.texture.delete();
      }
    }
  }, {
    key: "draw",
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;

      if (!this.state.model) {
        return;
      }

      var sizeScale = this.props.sizeScale;
      this.state.model.draw({
        uniforms: Object.assign({}, uniforms, {
          sizeScale: sizeScale,
          flatShade: !this.state.hasNormals
        })
      });
    }
  }, {
    key: "getModel",
    value: function getModel(mesh) {
      var model = new _core.Model(this.context.gl, Object.assign({}, this.getShaders(), {
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
  }, {
    key: "setTexture",
    value: function setTexture(src) {
      var _this = this;

      var gl = this.context.gl;
      var emptyTexture = this.state.emptyTexture;

      if (this.state.texture) {
        this.state.texture.delete();
      }

      if (src) {
        getTexture(gl, src).then(function (texture) {
          _this.setState({
            texture: texture
          });

          if (_this.state.model) {
            _this.state.model.setUniforms({
              sampler: _this.state.texture,
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

      var _this$props = this.props,
          data = _this$props.data,
          getPosition = _this$props.getPosition;
      var value = attribute.value,
          size = attribute.size;
      var i = startRow * size;

      var _createIterable = (0, _keplerOutdatedDeck.createIterable)(data, startRow, endRow),
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
  return SimpleMeshLayer;
}(_keplerOutdatedDeck.Layer);

exports.default = SimpleMeshLayer;
SimpleMeshLayer.layerName = 'SimpleMeshLayer';
SimpleMeshLayer.defaultProps = defaultProps;
//# sourceMappingURL=simple-mesh-layer.js.map