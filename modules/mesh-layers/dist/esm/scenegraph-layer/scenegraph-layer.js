import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { fp64, ScenegraphNode, isWebGL2, pbr, log } from '@luma.gl/core';
import { load } from '@loaders.gl/core';
import { MATRIX_ATTRIBUTES } from '../utils/matrix';
import vs from './scenegraph-layer-vertex.glsl';
import fs from './scenegraph-layer-fragment.glsl';
var fp64LowPart = fp64.fp64LowPart;
var DEFAULT_COLOR = [255, 255, 255, 255];
var defaultProps = {
  scenegraph: {
    type: 'object',
    value: null,
    async: true
  },
  fetch: function (_fetch) {
    function fetch(_x, _x2) {
      return _fetch.apply(this, arguments);
    }

    fetch.toString = function () {
      return _fetch.toString();
    };

    return fetch;
  }(function (url, _ref) {
    var propName = _ref.propName,
        layer = _ref.layer;

    if (propName === 'scenegraph') {
      return load(url, layer.getLoadOptions());
    }

    return fetch(url).then(function (response) {
      return response.json();
    });
  }),
  getScene: function getScene(scenegraph) {
    return scenegraph && scenegraph.scenes ? scenegraph.scenes[0] : scenegraph;
  },
  getAnimator: function getAnimator(scenegraph) {
    return scenegraph && scenegraph.animator;
  },
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
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
  _lighting: 'flat',
  _imageBasedLightingEnvironment: null,
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

var ScenegraphLayer = function (_Layer) {
  _inherits(ScenegraphLayer, _Layer);

  function ScenegraphLayer() {
    _classCallCheck(this, ScenegraphLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(ScenegraphLayer).apply(this, arguments));
  }

  _createClass(ScenegraphLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          accessor: 'getPosition',
          transition: true
        },
        instancePositions64xy: {
          size: 2,
          accessor: 'getPosition',
          update: this.calculateInstancePositions64xyLow
        },
        instanceColors: {
          size: 4,
          accessor: 'getColor',
          defaultValue: DEFAULT_COLOR,
          transition: true
        },
        instanceModelMatrix: MATRIX_ATTRIBUTES
      });
    }
  }, {
    key: "calculateInstancePositions64xyLow",
    value: function calculateInstancePositions64xyLow(attribute, _ref2) {
      var startRow = _ref2.startRow,
          endRow = _ref2.endRow;
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

      var _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;
          objectInfo.index++;
          var position = getPosition(point, objectInfo);
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
  }, {
    key: "updateState",
    value: function updateState(params) {
      _get(_getPrototypeOf(ScenegraphLayer.prototype), "updateState", this).call(this, params);

      var props = params.props,
          oldProps = params.oldProps;

      if (props.scenegraph !== oldProps.scenegraph) {
        var scenegraph = props.getScene(props.scenegraph);
        var animator = props.getAnimator(props.scenegraph);

        if (scenegraph instanceof ScenegraphNode) {
          this._deleteScenegraph();

          this._applyAllAttributes(scenegraph);

          this._applyAnimationsProp(scenegraph, animator, props._animations);

          this.setState({
            scenegraph: scenegraph,
            animator: animator
          });
        } else if (scenegraph !== null) {
          log.warn('invalid scenegraph:', scenegraph)();
        }
      } else if (props._animations !== oldProps._animations) {
        this._applyAnimationsProp(this.state.scenegraph, this.state.animator, props._animations);
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      this._deleteScenegraph();
    }
  }, {
    key: "_applyAllAttributes",
    value: function _applyAllAttributes(scenegraph) {
      var _this = this;

      if (this.state.attributesAvailable) {
        var allAttributes = this.getAttributeManager().getAttributes();
        scenegraph.traverse(function (model) {
          _this._setModelAttributes(model.model, allAttributes);
        });
      }
    }
  }, {
    key: "_applyAnimationsProp",
    value: function _applyAnimationsProp(scenegraph, animator, animationsProp) {
      if (!scenegraph || !animator || !animationsProp) {
        return;
      }

      var animations = animator.getAnimations();
      Object.keys(animationsProp).forEach(function (key) {
        var value = animationsProp[key];

        if (key === '*') {
          animations.forEach(function (animation) {
            Object.assign(animation, value);
          });
        } else if (Number.isFinite(Number(key))) {
          var number = Number(key);

          if (number >= 0 && number < animations.length) {
            Object.assign(animations[number], value);
          } else {
            log.warn("animation ".concat(key, " not found"))();
          }
        } else {
          var findResult = animations.find(function (_ref3) {
            var name = _ref3.name;
            return name === key;
          });

          if (findResult) {
            Object.assign(findResult, value);
          } else {
            log.warn("animation ".concat(key, " not found"))();
          }
        }
      });
    }
  }, {
    key: "_deleteScenegraph",
    value: function _deleteScenegraph() {
      var scenegraph = this.state.scenegraph;

      if (scenegraph instanceof ScenegraphNode) {
        scenegraph.delete();
      }
    }
  }, {
    key: "addVersionToShader",
    value: function addVersionToShader(source) {
      if (isWebGL2(this.context.gl)) {
        return "#version 300 es\n".concat(source);
      }

      return source;
    }
  }, {
    key: "getLoadOptions",
    value: function getLoadOptions() {
      var modules = ['project32', 'picking'];
      var _this$props2 = this.props,
          _lighting = _this$props2._lighting,
          _imageBasedLightingEnvironment = _this$props2._imageBasedLightingEnvironment;

      if (_lighting === 'pbr') {
        modules.push(pbr);
      }

      var env = null;

      if (_imageBasedLightingEnvironment) {
        if (typeof _imageBasedLightingEnvironment === 'function') {
          env = _imageBasedLightingEnvironment({
            gl: this.context.gl,
            layer: this
          });
        } else {
          env = _imageBasedLightingEnvironment;
        }
      }

      return {
        gl: this.context.gl,
        waitForFullLoad: true,
        imageBasedLightingEnvironment: env,
        modelOptions: {
          vs: this.addVersionToShader(vs),
          fs: this.addVersionToShader(fs),
          modules: modules,
          isInstanced: true
        },
        useTangents: false
      };
    }
  }, {
    key: "updateAttributes",
    value: function updateAttributes(props) {
      var _this2 = this;

      _get(_getPrototypeOf(ScenegraphLayer.prototype), "updateAttributes", this).call(this, props);

      this.setState({
        attributesAvailable: true
      });
      if (!this.state.scenegraph) return;
      var attributeManager = this.getAttributeManager();
      var changedAttributes = attributeManager.getChangedAttributes({
        clearChangedFlags: true
      });
      this.state.scenegraph.traverse(function (model) {
        _this2._setModelAttributes(model.model, changedAttributes);
      });
    }
  }, {
    key: "draw",
    value: function draw(_ref4) {
      var _ref4$moduleParameter = _ref4.moduleParameters,
          moduleParameters = _ref4$moduleParameter === void 0 ? null : _ref4$moduleParameter,
          _ref4$parameters = _ref4.parameters,
          parameters = _ref4$parameters === void 0 ? {} : _ref4$parameters,
          context = _ref4.context;
      if (!this.state.scenegraph) return;

      if (this.props._animations && this.state.animator) {
        this.state.animator.animate(context.animationProps.time);
      }

      var sizeScale = this.props.sizeScale;
      var numInstances = this.getNumInstances();
      this.state.scenegraph.traverse(function (model, _ref5) {
        var worldMatrix = _ref5.worldMatrix;
        model.model.setInstanceCount(numInstances);
        model.updateModuleSettings(moduleParameters);
        model.draw({
          parameters: parameters,
          uniforms: {
            sizeScale: sizeScale,
            sceneModelMatrix: worldMatrix,
            u_Camera: model.model.program.uniforms.project_uCameraPosition
          }
        });
      });
    }
  }]);

  return ScenegraphLayer;
}(Layer);

export { ScenegraphLayer as default };
ScenegraphLayer.layerName = 'ScenegraphLayer';
ScenegraphLayer.defaultProps = defaultProps;
//# sourceMappingURL=scenegraph-layer.js.map