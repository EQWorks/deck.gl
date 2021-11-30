"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _pointCloudLayerVertex = _interopRequireDefault(require("./point-cloud-layer-vertex.glsl"));

var _pointCloudLayerFragment = _interopRequireDefault(require("./point-cloud-layer-fragment.glsl"));

const {
  fp64LowPart
} = _keplerOutdatedLuma.fp64;
const DEFAULT_COLOR = [0, 0, 0, 255];
const DEFAULT_NORMAL = [0, 0, 1];
const defaultMaterial = new _keplerOutdatedLuma.PhongMaterial();
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

class PointCloudLayer extends _keplerOutdatedDeck.Layer {
  getShaders(id) {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs: _pointCloudLayerVertex.default,
      fs: _pointCloudLayerFragment.default,
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
      pointSize,
      sizeUnits
    } = this.props;
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

    return new _keplerOutdatedLuma.Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new _keplerOutdatedLuma.Geometry({
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
    } = (0, _keplerOutdatedDeck.createIterable)(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      const position = getPosition(object, objectInfo);
      value[i++] = fp64LowPart(position[0]);
      value[i++] = fp64LowPart(position[1]);
    }
  }

}

exports.default = PointCloudLayer;
PointCloudLayer.layerName = 'PointCloudLayer';
PointCloudLayer.defaultProps = defaultProps;
//# sourceMappingURL=point-cloud-layer.js.map