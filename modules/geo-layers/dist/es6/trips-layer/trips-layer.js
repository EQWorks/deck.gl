import { PathLayer } from 'kepler-outdated-deck.gl-layers';
import { createIterable } from 'kepler-outdated-deck.gl-core';
const defaultProps = {
  trailLength: {
    type: 'number',
    value: 120,
    min: 0
  },
  currentTime: {
    type: 'number',
    value: 0,
    min: 0
  },
  getTimestamps: {
    type: 'accessor',
    value: null
  }
};
export default class TripsLayer extends PathLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': `\
uniform float trailLength;
uniform bool isPath3D;
attribute vec2 instanceTimestamps;
varying float vTime;
`,
      'vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);': `\
vec2 timestamps = instanceTimestamps;
if (!isPath3D) {
  prevPosition.z = 0.0;
  currPosition.z = 0.0;
  nextPosition.z = 0.0;
  timestamps.x = instanceStartPositions.z;
  timestamps.y = instanceEndPositions.z;
}
`,
      'vs:#main-end': `\
float shiftZ = sin(timestamps.x) * 1e-4;
gl_Position.z += shiftZ;
vTime = timestamps.x + (timestamps.y - timestamps.x) * vPathPosition.y / vPathLength;
`,
      'fs:#decl': `\
uniform float trailLength;
uniform float currentTime;
varying float vTime;
`,
      'fs:#main-start': `\
if(vTime > currentTime || vTime < currentTime - trailLength) {
  discard;
}
`,
      'gl_FragColor = vColor;': 'gl_FragColor.a *= 1.0 - (currentTime - vTime) / trailLength;'
    };
    return shaders;
  }

  initializeState(params) {
    super.initializeState(params);
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instanceTimestamps: {
        size: 2,
        update: this.calculateInstanceTimestamps
      }
    });
  }

  draw(params) {
    const _this$props = this.props,
          trailLength = _this$props.trailLength,
          currentTime = _this$props.currentTime,
          getTimestamps = _this$props.getTimestamps;
    params.uniforms = Object.assign({}, params.uniforms, {
      trailLength,
      currentTime,
      isPath3D: Boolean(getTimestamps)
    });
    super.draw(params);
  }

  calculateInstanceTimestamps(attribute, _ref) {
    let startRow = _ref.startRow,
        endRow = _ref.endRow;
    const _this$props2 = this.props,
          data = _this$props2.data,
          getTimestamps = _this$props2.getTimestamps;

    if (!getTimestamps) {
      attribute.constant = true;
      attribute.value = new Float32Array(2);
      return;
    }

    const _this$state$pathTesse = this.state.pathTesselator,
          bufferLayout = _this$state$pathTesse.bufferLayout,
          instanceCount = _this$state$pathTesse.instanceCount;
    const value = new Float32Array(instanceCount * 2);

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    let i = 0;

    for (let objectIndex = 0; objectIndex < startRow; objectIndex++) {
      i += bufferLayout[objectIndex] * 2;
    }

    for (const object of iterable) {
      objectInfo.index++;
      const geometrySize = bufferLayout[objectInfo.index];
      const timestamps = getTimestamps(object, objectInfo);

      for (let j = 0; j < geometrySize; j++) {
        value[i++] = timestamps[j];
        value[i++] = timestamps[j + 1];
      }
    }

    attribute.constant = false;
    attribute.value = value;
  }

}
TripsLayer.layerName = 'TripsLayer';
TripsLayer.defaultProps = defaultProps;
//# sourceMappingURL=trips-layer.js.map