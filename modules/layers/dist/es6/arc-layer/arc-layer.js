import { Layer, createIterable } from 'kepler-outdated-deck.gl-core';
import { Model, Geometry, fp64 } from '@luma.gl/core';
const fp64LowPart = fp64.fp64LowPart;
import vs from './arc-layer-vertex.glsl';
import vs64 from './arc-layer-vertex-64.glsl';
import fs from './arc-layer-fragment.glsl';
const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultProps = {
  fp64: false,
  getSourcePosition: {
    type: 'accessor',
    value: x => x.sourcePosition
  },
  getTargetPosition: {
    type: 'accessor',
    value: x => x.targetPosition
  },
  getSourceColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getTargetColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getWidth: {
    type: 'accessor',
    value: 1
  },
  getHeight: {
    type: 'accessor',
    value: 1
  },
  getTilt: {
    type: 'accessor',
    value: 0
  },
  widthUnits: 'pixels',
  widthScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  widthMinPixels: {
    type: 'number',
    value: 0,
    min: 0
  },
  widthMaxPixels: {
    type: 'number',
    value: Number.MAX_SAFE_INTEGER,
    min: 0
  },
  getStrokeWidth: {
    deprecatedFor: 'getWidth'
  }
};
export default class ArcLayer extends Layer {
  getShaders() {
    return this.use64bitProjection() ? {
      vs: vs64,
      fs,
      modules: ['project64', 'picking']
    } : {
      vs,
      fs,
      modules: ['picking']
    };
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instancePositions: {
        size: 4,
        transition: true,
        accessor: ['getSourcePosition', 'getTargetPosition'],
        update: this.calculateInstancePositions
      },
      instancePositions64Low: {
        size: 4,
        accessor: ['getSourcePosition', 'getTargetPosition'],
        update: this.calculateInstancePositions64Low
      },
      instanceSourceColors: {
        size: 4,
        type: 5121,
        transition: true,
        accessor: 'getSourceColor',
        defaultValue: DEFAULT_COLOR
      },
      instanceTargetColors: {
        size: 4,
        type: 5121,
        transition: true,
        accessor: 'getTargetColor',
        defaultValue: DEFAULT_COLOR
      },
      instanceWidths: {
        size: 1,
        transition: true,
        accessor: 'getWidth',
        defaultValue: 1
      },
      instanceHeights: {
        size: 1,
        transition: true,
        accessor: 'getHeight',
        defaultValue: 1
      },
      instanceTilts: {
        size: 1,
        transition: true,
        accessor: 'getTilt',
        defaultValue: 0
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
          widthUnits = _this$props.widthUnits,
          widthScale = _this$props.widthScale,
          widthMinPixels = _this$props.widthMinPixels,
          widthMaxPixels = _this$props.widthMaxPixels;
    const widthMultiplier = widthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      widthScale: widthScale * widthMultiplier,
      widthMinPixels,
      widthMaxPixels
    })).draw();
  }

  _getModel(gl) {
    let positions = [];
    const NUM_SEGMENTS = 50;

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      positions = positions.concat([i, -1, 0, i, 1, 0]);
    }

    const model = new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 5,
        attributes: {
          positions: new Float32Array(positions)
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
    model.setUniforms({
      numSegments: NUM_SEGMENTS
    });
    return model;
  }

  calculateInstancePositions(attribute, _ref3) {
    let startRow = _ref3.startRow,
        endRow = _ref3.endRow;
    const _this$props2 = this.props,
          data = _this$props2.data,
          getSourcePosition = _this$props2.getSourcePosition,
          getTargetPosition = _this$props2.getTargetPosition;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;
      const sourcePosition = getSourcePosition(object, objectInfo);
      value[i++] = sourcePosition[0];
      value[i++] = sourcePosition[1];
      const targetPosition = getTargetPosition(object, objectInfo);
      value[i++] = targetPosition[0];
      value[i++] = targetPosition[1];
    }
  }

  calculateInstancePositions64Low(attribute, _ref4) {
    let startRow = _ref4.startRow,
        endRow = _ref4.endRow;
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (!isFP64) {
      attribute.value = new Float32Array(4);
      return;
    }

    const _this$props3 = this.props,
          data = _this$props3.data,
          getSourcePosition = _this$props3.getSourcePosition,
          getTargetPosition = _this$props3.getTargetPosition;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;

    const _createIterable2 = createIterable(data, startRow, endRow),
          iterable = _createIterable2.iterable,
          objectInfo = _createIterable2.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;
      const sourcePosition = getSourcePosition(object, objectInfo);
      value[i++] = fp64LowPart(sourcePosition[0]);
      value[i++] = fp64LowPart(sourcePosition[1]);
      const targetPosition = getTargetPosition(object, objectInfo);
      value[i++] = fp64LowPart(targetPosition[0]);
      value[i++] = fp64LowPart(targetPosition[1]);
    }
  }

}
ArcLayer.layerName = 'ArcLayer';
ArcLayer.defaultProps = defaultProps;
//# sourceMappingURL=arc-layer.js.map