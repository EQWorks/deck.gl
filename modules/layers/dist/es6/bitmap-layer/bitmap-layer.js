import { Layer } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry, Texture2D, fp64 } from '@luma.gl/core';
import { loadImage } from '@loaders.gl/images';
const fp64LowPart = fp64.fp64LowPart;
import vs from './bitmap-layer-vertex';
import fs from './bitmap-layer-fragment';
const DEFAULT_TEXTURE_PARAMETERS = {
  [10241]: 9987,
  [10240]: 9729,
  [10242]: 33071,
  [10243]: 33071
};
const defaultProps = {
  image: null,
  bounds: {
    type: 'array',
    value: [1, 0, 0, 1],
    compare: true
  },
  fp64: false,
  desaturate: {
    type: 'number',
    min: 0,
    max: 1,
    value: 0
  },
  transparentColor: {
    type: 'color',
    value: [0, 0, 0, 0]
  },
  tintColor: {
    type: 'color',
    value: [255, 255, 255]
  }
};
export default class BitmapLayer extends Layer {
  getShaders() {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {
      vs,
      fs,
      modules: [projectModule, 'picking']
    };
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    attributeManager.add({
      positions: {
        size: 3,
        update: this.calculatePositions,
        value: new Float32Array(12)
      },
      positions64xyLow: {
        size: 3,
        update: this.calculatePositions64xyLow,
        value: new Float32Array(12)
      }
    });
    this.setState({
      numInstances: 4
    });
  }

  updateState(_ref) {
    let props = _ref.props,
        oldProps = _ref.oldProps,
        changeFlags = _ref.changeFlags;

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

    if (props.image !== oldProps.image) {
      this.loadTexture(props.image);
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      this.setState({
        positions: this._getPositionsFromBounds(props.bounds)
      });
      attributeManager.invalidate('positions');
      attributeManager.invalidate('positions64xyLow');
    }
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.bitmapTexture) {
      this.state.bitmapTexture.delete();
    }
  }

  _getPositionsFromBounds(bounds) {
    const positions = new Array(12);

    if (Number.isFinite(bounds[0])) {
      positions[0] = bounds[0];
      positions[1] = bounds[1];
      positions[2] = 0;
      positions[3] = bounds[0];
      positions[4] = bounds[3];
      positions[5] = 0;
      positions[6] = bounds[2];
      positions[7] = bounds[3];
      positions[8] = 0;
      positions[9] = bounds[2];
      positions[10] = bounds[1];
      positions[11] = 0;
    } else {
      for (let i = 0; i < bounds.length; i++) {
        positions[i * 3 + 0] = bounds[i][0];
        positions[i * 3 + 1] = bounds[i][1];
        positions[i * 3 + 2] = bounds[i][2] || 0;
      }
    }

    return positions;
  }

  _getModel(gl) {
    if (!gl) {
      return null;
    }

    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      shaderCache: this.context.shaderCache,
      geometry: new Geometry({
        drawMode: 6,
        vertexCount: 4,
        attributes: {
          texCoords: new Float32Array([0, 0, 0, 1, 1, 1, 1, 0])
        }
      }),
      isInstanced: false
    }));
  }

  draw(_ref2) {
    let uniforms = _ref2.uniforms;
    const _this$state = this.state,
          bitmapTexture = _this$state.bitmapTexture,
          model = _this$state.model;
    const _this$props = this.props,
          desaturate = _this$props.desaturate,
          transparentColor = _this$props.transparentColor,
          tintColor = _this$props.tintColor;

    if (bitmapTexture && model) {
      model.setUniforms(Object.assign({}, uniforms, {
        bitmapTexture,
        desaturate,
        transparentColor,
        tintColor
      })).draw();
    }
  }

  loadTexture(image) {
    if (typeof image === 'string') {
      image = loadImage(image);
    }

    if (image instanceof Promise) {
      image.then(data => this.loadTexture(data));
      return;
    }

    const gl = this.context.gl;

    if (this.state.bitmapTexture) {
      this.state.bitmapTexture.delete();
    }

    if (image instanceof Texture2D) {
      this.setState({
        bitmapTexture: image
      });
    } else if (image instanceof Image || image instanceof HTMLCanvasElement) {
      this.setState({
        bitmapTexture: new Texture2D(gl, {
          data: image,
          parameters: DEFAULT_TEXTURE_PARAMETERS
        })
      });
    }
  }

  calculatePositions(_ref3) {
    let value = _ref3.value;
    const positions = this.state.positions;
    value.set(positions);
  }

  calculatePositions64xyLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(4);
      return;
    }

    const value = attribute.value;
    value.set(this.state.positions.map(fp64LowPart));
  }

}
BitmapLayer.layerName = 'BitmapLayer';
BitmapLayer.defaultProps = defaultProps;
//# sourceMappingURL=bitmap-layer.js.map