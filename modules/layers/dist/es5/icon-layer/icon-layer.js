"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _iconLayerVertex = _interopRequireDefault(require("./icon-layer-vertex.glsl"));

var _iconLayerFragment = _interopRequireDefault(require("./icon-layer-fragment.glsl"));

var _iconManager = _interopRequireDefault(require("./icon-manager"));

const {
  fp64LowPart
} = _keplerOutdatedLuma.fp64;
const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultProps = {
  iconAtlas: null,
  iconMapping: {
    type: 'object',
    value: {},
    async: true
  },
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  fp64: false,
  billboard: true,
  sizeUnits: 'pixels',
  sizeMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  sizeMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getIcon: {
    type: 'accessor',
    value: x => x.icon
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getSize: {
    type: 'accessor',
    value: 1
  },
  getAngle: {
    type: 'accessor',
    value: 0
  }
};

class IconLayer extends _keplerOutdatedDeck.Layer {
  getShaders() {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs: _iconLayerVertex.default,
      fs: _iconLayerFragment.default,
      modules: [projectModule, 'picking']
    };
  }

  initializeState() {
    this.state = {
      iconManager: new _iconManager.default(this.context.gl, {
        onUpdate: () => this._onUpdate()
      })
    };
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
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
      instanceSizes: {
        size: 1,
        transition: true,
        accessor: 'getSize',
        defaultValue: 1
      },
      instanceOffsets: {
        size: 2,
        accessor: 'getIcon',
        update: this.calculateInstanceOffsets
      },
      instanceIconFrames: {
        size: 4,
        accessor: 'getIcon',
        update: this.calculateInstanceIconFrames
      },
      instanceColorModes: {
        size: 1,
        type: 5121,
        accessor: 'getIcon',
        update: this.calculateInstanceColorMode
      },
      instanceColors: {
        size: 4,
        type: 5121,
        transition: true,
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR
      },
      instanceAngles: {
        size: 1,
        transition: true,
        accessor: 'getAngle',
        defaultValue: 0
      }
    });
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });
    const attributeManager = this.getAttributeManager();
    const {
      iconManager
    } = this.state;
    const {
      iconAtlas,
      iconMapping,
      data,
      getIcon
    } = props;
    let iconMappingChanged = false;

    if (iconAtlas) {
      if (oldProps.iconAtlas !== props.iconAtlas) {
        iconManager.setProps({
          iconAtlas,
          autoPacking: false
        });
      }

      if (oldProps.iconMapping !== props.iconMapping) {
        iconManager.setProps({
          iconMapping
        });
        iconMappingChanged = true;
      }
    } else {
      iconManager.setProps({
        autoPacking: true
      });
    }

    if (changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getIcon)) {
      iconManager.setProps({
        data,
        getIcon
      });
      iconMappingChanged = true;
    }

    if (iconMappingChanged) {
      attributeManager.invalidate('instanceOffsets');
      attributeManager.invalidate('instanceIconFrames');
      attributeManager.invalidate('instanceColorModes');
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

  finalizeState() {
    super.finalizeState();
    this.state.iconManager.finalize();
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      sizeScale,
      sizeMinPixels,
      sizeMaxPixels,
      sizeUnits,
      billboard
    } = this.props;
    const {
      iconManager
    } = this.state;
    const {
      viewport
    } = this.context;
    const iconsTexture = iconManager.getTexture();

    if (iconsTexture) {
      this.state.model.setUniforms(Object.assign({}, uniforms, {
        iconsTexture,
        iconsTextureDim: [iconsTexture.width, iconsTexture.height],
        sizeScale: sizeScale * (sizeUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1),
        sizeMinPixels,
        sizeMaxPixels,
        billboard
      })).draw();
    }
  }

  _getModel(gl) {
    const positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];
    return new _keplerOutdatedLuma.Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new _keplerOutdatedLuma.Geometry({
        drawMode: 6,
        attributes: {
          positions: new Float32Array(positions)
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  _onUpdate() {
    this.setNeedsRedraw();
  }

  calculateInstancePositions64xyLow(attribute) {
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
      value
    } = attribute;
    let i = 0;
    const {
      iterable,
      objectInfo
    } = (0, _keplerOutdatedDeck.createIterable)(data);

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

  calculateInstanceOffsets(attribute, _ref3) {
    let {
      startRow,
      endRow
    } = _ref3;
    const {
      data
    } = this.props;
    const {
      iconManager
    } = this.state;
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
      const rect = iconManager.getIconMapping(object, objectInfo);
      value[i++] = rect.width / 2 - rect.anchorX || 0;
      value[i++] = rect.height / 2 - rect.anchorY || 0;
    }
  }

  calculateInstanceColorMode(attribute, _ref4) {
    let {
      startRow,
      endRow
    } = _ref4;
    const {
      data
    } = this.props;
    const {
      iconManager
    } = this.state;
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
      const mapping = iconManager.getIconMapping(object, objectInfo);
      const colorMode = mapping.mask;
      value[i++] = colorMode ? 1 : 0;
    }
  }

  calculateInstanceIconFrames(attribute, _ref5) {
    let {
      startRow,
      endRow
    } = _ref5;
    const {
      data
    } = this.props;
    const {
      iconManager
    } = this.state;
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
      const rect = iconManager.getIconMapping(object, objectInfo);
      value[i++] = rect.x || 0;
      value[i++] = rect.y || 0;
      value[i++] = rect.width || 0;
      value[i++] = rect.height || 0;
    }
  }

}

exports.default = IconLayer;
IconLayer.layerName = 'IconLayer';
IconLayer.defaultProps = defaultProps;
//# sourceMappingURL=icon-layer.js.map