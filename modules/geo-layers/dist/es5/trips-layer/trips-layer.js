"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-layers");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-core");

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

class TripsLayer extends _keplerOutdatedDeck.PathLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': "uniform float trailLength;\nuniform bool isPath3D;\nattribute vec2 instanceTimestamps;\nvarying float vTime;\n",
      'vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);': "vec2 timestamps = instanceTimestamps;\nif (!isPath3D) {\n  prevPosition.z = 0.0;\n  currPosition.z = 0.0;\n  nextPosition.z = 0.0;\n  timestamps.x = instanceStartPositions.z;\n  timestamps.y = instanceEndPositions.z;\n}\n",
      'vs:#main-end': "float shiftZ = sin(timestamps.x) * 1e-4;\ngl_Position.z += shiftZ;\nvTime = timestamps.x + (timestamps.y - timestamps.x) * vPathPosition.y / vPathLength;\n",
      'fs:#decl': "uniform float trailLength;\nuniform float currentTime;\nvarying float vTime;\n",
      'fs:#main-start': "if(vTime > currentTime || vTime < currentTime - trailLength) {\n  discard;\n}\n",
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
    const {
      trailLength,
      currentTime,
      getTimestamps
    } = this.props;
    params.uniforms = Object.assign({}, params.uniforms, {
      trailLength,
      currentTime,
      isPath3D: Boolean(getTimestamps)
    });
    super.draw(params);
  }

  calculateInstanceTimestamps(attribute, _ref) {
    let {
      startRow,
      endRow
    } = _ref;
    const {
      data,
      getTimestamps
    } = this.props;

    if (!getTimestamps) {
      attribute.constant = true;
      attribute.value = new Float32Array(2);
      return;
    }

    const {
      pathTesselator: {
        bufferLayout,
        instanceCount
      }
    } = this.state;
    const value = new Float32Array(instanceCount * 2);
    const {
      iterable,
      objectInfo
    } = (0, _keplerOutdatedDeck2.createIterable)(data, startRow, endRow);
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

exports.default = TripsLayer;
TripsLayer.layerName = 'TripsLayer';
TripsLayer.defaultProps = defaultProps;
//# sourceMappingURL=trips-layer.js.map