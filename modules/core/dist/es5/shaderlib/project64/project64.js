"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _project = _interopRequireDefault(require("../project/project"));

var _memoize = _interopRequireDefault(require("../../utils/memoize"));

var _project2 = _interopRequireDefault(require("./project64.glsl"));

const {
  fp64ify,
  fp64ifyMatrix4
} = _core.fp64;
var _default = {
  name: 'project64',
  dependencies: [_project.default, _core.fp64],
  vs: _project2.default,
  getUniforms,
  deprecations: [{
    type: 'function',
    old: 'project_to_clipspace_fp64',
    new: 'project_common_position_to_clipspace_fp64'
  }]
};
exports.default = _default;
const DEFAULT_MODULE_OPTIONS = {};
const getMemoizedUniforms = (0, _memoize.default)(calculateUniforms);

function getUniforms() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_MODULE_OPTIONS;
  let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    project_uViewProjectionMatrix,
    project_uScale
  } = context;

  if (project_uViewProjectionMatrix && project_uScale) {
    return getMemoizedUniforms({
      project_uViewProjectionMatrix,
      project_uScale
    });
  }

  return {};
}

function calculateUniforms(_ref) {
  let {
    project_uViewProjectionMatrix,
    project_uScale
  } = _ref;
  const glViewProjectionMatrixFP64 = fp64ifyMatrix4(project_uViewProjectionMatrix);
  const scaleFP64 = fp64ify(project_uScale);
  return {
    project_uViewProjectionMatrixFP64: glViewProjectionMatrixFP64,
    project64_uViewProjectionMatrix: glViewProjectionMatrixFP64,
    project64_uScale: scaleFP64
  };
}
//# sourceMappingURL=project64.js.map