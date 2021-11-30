"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _core = require("@loaders.gl/core");

var _matrix = require("../utils/matrix");

var _scenegraphLayerVertex = _interopRequireDefault(require("./scenegraph-layer-vertex.glsl"));

var _scenegraphLayerFragment = _interopRequireDefault(require("./scenegraph-layer-fragment.glsl"));

const {
  fp64LowPart
} = _keplerOutdatedLuma.fp64;
const DEFAULT_COLOR = [255, 255, 255, 255];
const defaultProps = {
  scenegraph: {
    type: 'object',
    value: null,
    async: true
  },
  fetch: (url, _ref) => {
    let {
      propName,
      layer
    } = _ref;

    if (propName === 'scenegraph') {
      return (0, _core.load)(url, layer.getLoadOptions());
    }

    return fetch(url).then(response => response.json());
  },
  getScene: scenegraph => scenegraph && scenegraph.scenes ? scenegraph.scenes[0] : scenegraph,
  getAnimator: scenegraph => scenegraph && scenegraph.animator,
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
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

class ScenegraphLayer extends _keplerOutdatedDeck.Layer {
  initializeState() {
    const attributeManager = this.getAttributeManager();
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
      instanceModelMatrix: _matrix.MATRIX_ATTRIBUTES
    });
  }

  calculateInstancePositions64xyLow(attribute, _ref2) {
    let {
      startRow,
      endRow
    } = _ref2;
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

    for (const point of iterable) {
      objectInfo.index++;
      const position = getPosition(point, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

  updateState(params) {
    super.updateState(params);
    const {
      props,
      oldProps
    } = params;

    if (props.scenegraph !== oldProps.scenegraph) {
      const scenegraph = props.getScene(props.scenegraph);
      const animator = props.getAnimator(props.scenegraph);

      if (scenegraph instanceof _keplerOutdatedLuma.ScenegraphNode) {
        this._deleteScenegraph();

        this._applyAllAttributes(scenegraph);

        this._applyAnimationsProp(scenegraph, animator, props._animations);

        this.setState({
          scenegraph,
          animator
        });
      } else if (scenegraph !== null) {
        _keplerOutdatedLuma.log.warn('invalid scenegraph:', scenegraph)();
      }
    } else if (props._animations !== oldProps._animations) {
      this._applyAnimationsProp(this.state.scenegraph, this.state.animator, props._animations);
    }
  }

  finalizeState() {
    this._deleteScenegraph();
  }

  _applyAllAttributes(scenegraph) {
    if (this.state.attributesAvailable) {
      const allAttributes = this.getAttributeManager().getAttributes();
      scenegraph.traverse(model => {
        this._setModelAttributes(model.model, allAttributes);
      });
    }
  }

  _applyAnimationsProp(scenegraph, animator, animationsProp) {
    if (!scenegraph || !animator || !animationsProp) {
      return;
    }

    const animations = animator.getAnimations();
    Object.keys(animationsProp).forEach(key => {
      const value = animationsProp[key];

      if (key === '*') {
        animations.forEach(animation => {
          Object.assign(animation, value);
        });
      } else if (Number.isFinite(Number(key))) {
        const number = Number(key);

        if (number >= 0 && number < animations.length) {
          Object.assign(animations[number], value);
        } else {
          _keplerOutdatedLuma.log.warn("animation ".concat(key, " not found"))();
        }
      } else {
        const findResult = animations.find(_ref3 => {
          let {
            name
          } = _ref3;
          return name === key;
        });

        if (findResult) {
          Object.assign(findResult, value);
        } else {
          _keplerOutdatedLuma.log.warn("animation ".concat(key, " not found"))();
        }
      }
    });
  }

  _deleteScenegraph() {
    const {
      scenegraph
    } = this.state;

    if (scenegraph instanceof _keplerOutdatedLuma.ScenegraphNode) {
      scenegraph.delete();
    }
  }

  addVersionToShader(source) {
    if ((0, _keplerOutdatedLuma.isWebGL2)(this.context.gl)) {
      return "#version 300 es\n".concat(source);
    }

    return source;
  }

  getLoadOptions() {
    const modules = ['project32', 'picking'];
    const {
      _lighting,
      _imageBasedLightingEnvironment
    } = this.props;

    if (_lighting === 'pbr') {
      modules.push(_keplerOutdatedLuma.pbr);
    }

    let env = null;

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
        vs: this.addVersionToShader(_scenegraphLayerVertex.default),
        fs: this.addVersionToShader(_scenegraphLayerFragment.default),
        modules,
        isInstanced: true
      },
      useTangents: false
    };
  }

  updateAttributes(props) {
    super.updateAttributes(props);
    this.setState({
      attributesAvailable: true
    });
    if (!this.state.scenegraph) return;
    const attributeManager = this.getAttributeManager();
    const changedAttributes = attributeManager.getChangedAttributes({
      clearChangedFlags: true
    });
    this.state.scenegraph.traverse(model => {
      this._setModelAttributes(model.model, changedAttributes);
    });
  }

  draw(_ref4) {
    let {
      moduleParameters = null,
      parameters = {},
      context
    } = _ref4;
    if (!this.state.scenegraph) return;

    if (this.props._animations && this.state.animator) {
      this.state.animator.animate(context.animationProps.time);
    }

    const {
      sizeScale
    } = this.props;
    const numInstances = this.getNumInstances();
    this.state.scenegraph.traverse((model, _ref5) => {
      let {
        worldMatrix
      } = _ref5;
      model.model.setInstanceCount(numInstances);
      model.updateModuleSettings(moduleParameters);
      model.draw({
        parameters,
        uniforms: {
          sizeScale,
          sceneModelMatrix: worldMatrix,
          u_Camera: model.model.program.uniforms.project_uCameraPosition
        }
      });
    });
  }

}

exports.default = ScenegraphLayer;
ScenegraphLayer.layerName = 'ScenegraphLayer';
ScenegraphLayer.defaultProps = defaultProps;
//# sourceMappingURL=scenegraph-layer.js.map