"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MATRIX_ATTRIBUTES = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var RADIAN_PER_DEGREE = Math.PI / 180;
var modelMatrix = new Float32Array(16);
var valueArray = new Float32Array(12);

function calculateTransformMatrix(targetMatrix, orientation, scale) {
  var pitch = orientation[0] * RADIAN_PER_DEGREE;
  var yaw = orientation[1] * RADIAN_PER_DEGREE;
  var roll = orientation[2] * RADIAN_PER_DEGREE;
  var sr = Math.sin(roll);
  var sp = Math.sin(pitch);
  var sw = Math.sin(yaw);
  var cr = Math.cos(roll);
  var cp = Math.cos(pitch);
  var cw = Math.cos(yaw);
  var scx = scale[0];
  var scy = scale[1];
  var scz = scale[2];
  targetMatrix[0] = scx * cw * cp;
  targetMatrix[1] = scx * sw * cp;
  targetMatrix[2] = scx * -sp;
  targetMatrix[3] = scy * (-sw * cr + cw * sp * sr);
  targetMatrix[4] = scy * (cw * cr + sw * sp * sr);
  targetMatrix[5] = scy * cp * sr;
  targetMatrix[6] = scz * (sw * sr + cw * sp * cr);
  targetMatrix[7] = scz * (-cw * sr + sw * sp * cr);
  targetMatrix[8] = scz * cp * cr;
}

function getExtendedMat3FromMat4(mat4) {
  mat4[0] = mat4[0];
  mat4[1] = mat4[1];
  mat4[2] = mat4[2];
  mat4[3] = mat4[4];
  mat4[4] = mat4[5];
  mat4[5] = mat4[6];
  mat4[6] = mat4[8];
  mat4[7] = mat4[9];
  mat4[8] = mat4[10];
  mat4[9] = mat4[12];
  mat4[10] = mat4[13];
  mat4[11] = mat4[14];
  return mat4.subarray(0, 12);
}

var MATRIX_ATTRIBUTES = {
  size: 12,
  accessor: ['getOrientation', 'getScale', 'getTranslation', 'getTransformMatrix'],
  shaderAttributes: {
    instanceModelMatrix__LOCATION_0: {
      size: 3,
      stride: 48,
      offset: 0
    },
    instanceModelMatrix__LOCATION_1: {
      size: 3,
      stride: 48,
      offset: 12
    },
    instanceModelMatrix__LOCATION_2: {
      size: 3,
      stride: 48,
      offset: 24
    },
    instanceTranslation: {
      size: 3,
      stride: 48,
      offset: 36
    }
  },
  update: function update(attribute, _ref) {
    var startRow = _ref.startRow,
        endRow = _ref.endRow;
    var _this$props = this.props,
        data = _this$props.data,
        getOrientation = _this$props.getOrientation,
        getScale = _this$props.getScale,
        getTranslation = _this$props.getTranslation,
        getTransformMatrix = _this$props.getTransformMatrix;
    var arrayMatrix = Array.isArray(getTransformMatrix);
    var constantMatrix = arrayMatrix && getTransformMatrix.length === 16;
    var constantScale = Array.isArray(getScale);
    var constantOrientation = Array.isArray(getOrientation);
    var constantTranslation = Array.isArray(getTranslation);
    var hasMatrix = constantMatrix || !arrayMatrix && Boolean(getTransformMatrix(data[0]));

    if (hasMatrix) {
      attribute.constant = constantMatrix;
    } else {
      attribute.constant = constantOrientation && constantScale && constantTranslation;
    }

    var instanceModelMatrixData = attribute.value;

    if (attribute.constant) {
      var matrix;

      if (hasMatrix) {
        modelMatrix.set(getTransformMatrix);
        matrix = getExtendedMat3FromMat4(modelMatrix);
      } else {
        matrix = valueArray;
        var orientation = getOrientation;
        var scale = getScale;
        calculateTransformMatrix(matrix, orientation, scale);
        matrix.set(getTranslation, 9);
      }

      attribute.value = new Float32Array(matrix);
    } else {
      var i = startRow * attribute.size;

      var _createIterable = (0, _keplerOutdatedDeck.createIterable)(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;

          var _matrix = void 0;

          if (hasMatrix) {
            modelMatrix.set(constantMatrix ? getTransformMatrix : getTransformMatrix(object, objectInfo));
            _matrix = getExtendedMat3FromMat4(modelMatrix);
          } else {
            _matrix = valueArray;

            var _orientation = constantOrientation ? getOrientation : getOrientation(object, objectInfo);

            var _scale = constantScale ? getScale : getScale(object, objectInfo);

            calculateTransformMatrix(_matrix, _orientation, _scale);

            _matrix.set(constantTranslation ? getTranslation : getTranslation(object, objectInfo), 9);
          }

          instanceModelMatrixData[i++] = _matrix[0];
          instanceModelMatrixData[i++] = _matrix[1];
          instanceModelMatrixData[i++] = _matrix[2];
          instanceModelMatrixData[i++] = _matrix[3];
          instanceModelMatrixData[i++] = _matrix[4];
          instanceModelMatrixData[i++] = _matrix[5];
          instanceModelMatrixData[i++] = _matrix[6];
          instanceModelMatrixData[i++] = _matrix[7];
          instanceModelMatrixData[i++] = _matrix[8];
          instanceModelMatrixData[i++] = _matrix[9];
          instanceModelMatrixData[i++] = _matrix[10];
          instanceModelMatrixData[i++] = _matrix[11];
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
  }
};
exports.MATRIX_ATTRIBUTES = MATRIX_ATTRIBUTES;
//# sourceMappingURL=matrix.js.map