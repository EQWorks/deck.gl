import { Buffer } from 'kepler-outdated-luma.gl-core';
import { padArray } from '../utils/array-utils';
const ATTRIBUTE_MAPPING = {
  1: 'float',
  2: 'vec2',
  3: 'vec3',
  4: 'vec4'
};
export function getShaders(transitions) {
  const varyings = [];
  const attributeDeclarations = [];
  const uniformsDeclarations = [];
  const varyingDeclarations = [];
  const calculations = [];

  for (const attributeName in transitions) {
    const transition = transitions[attributeName];
    const attributeType = ATTRIBUTE_MAPPING[transition.attribute.size];

    if (attributeType) {
      transition.bufferIndex = varyings.length;
      varyings.push(attributeName);
      attributeDeclarations.push("attribute ".concat(attributeType, " ").concat(attributeName, "From;"));
      attributeDeclarations.push("attribute ".concat(attributeType, " ").concat(attributeName, "To;"));
      uniformsDeclarations.push("uniform float ".concat(attributeName, "Time;"));
      varyingDeclarations.push("varying ".concat(attributeType, " ").concat(attributeName, ";"));
      calculations.push("".concat(attributeName, " = mix(").concat(attributeName, "From, ").concat(attributeName, "To,\n        ").concat(attributeName, "Time);"));
    }
  }

  const vs = "\n#define SHADER_NAME feedback-vertex-shader\n".concat(attributeDeclarations.join('\n'), "\n").concat(uniformsDeclarations.join('\n'), "\n").concat(varyingDeclarations.join('\n'), "\n\nvoid main(void) {\n  ").concat(calculations.join('\n'), "\n  gl_Position = vec4(0.0);\n}\n");
  const fs = "#define SHADER_NAME feedback-fragment-shader\n\nprecision highp float;\n\n".concat(varyingDeclarations.join('\n'), "\n\nvoid main(void) {\n  gl_FragColor = vec4(0.0);\n}\n");
  return {
    vs,
    fs,
    varyings
  };
}
export function getBuffers(transitions) {
  const sourceBuffers = {};
  const feedbackBuffers = {};

  for (const attributeName in transitions) {
    const {
      fromState,
      toState,
      buffer
    } = transitions[attributeName];
    sourceBuffers["".concat(attributeName, "From")] = fromState instanceof Buffer ? [fromState, {
      divisor: 0
    }] : fromState;
    sourceBuffers["".concat(attributeName, "To")] = toState;
    feedbackBuffers["".concat(attributeName)] = buffer;
  }

  return {
    sourceBuffers,
    feedbackBuffers
  };
}
export function padBuffer(_ref) {
  let {
    fromState,
    toState,
    fromLength,
    toLength,
    fromBufferLayout,
    toBufferLayout,
    getData = x => x
  } = _ref;
  const hasBufferLayout = fromBufferLayout && toBufferLayout;

  if (!hasBufferLayout && fromLength >= toLength || !(fromState instanceof Buffer)) {
    return;
  }

  const data = new Float32Array(toLength);
  const fromData = fromState.getData({});
  const {
    size,
    constant
  } = toState;
  const toData = constant ? toState.getValue() : toState.getBuffer().getData({});
  const getMissingData = constant ? (i, chunk) => getData(toData, chunk) : (i, chunk) => getData(toData.subarray(i, i + size), chunk);
  padArray({
    source: fromData,
    target: data,
    sourceLayout: fromBufferLayout,
    targetLayout: toBufferLayout,
    size: toState.size,
    getData: getMissingData
  });
  fromState.setData({
    data
  });
}
//# sourceMappingURL=attribute-transition-utils.js.map