import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { experimental } from 'kepler-outdated-deck.gl-core';
var Tesselator = experimental.Tesselator;
import { fp64 as fp64Module } from '@luma.gl/core';
var fp64LowPart = fp64Module.fp64LowPart;

var PathTesselator = function (_Tesselator) {
  _inherits(PathTesselator, _Tesselator);

  function PathTesselator(_ref) {
    var data = _ref.data,
        getGeometry = _ref.getGeometry,
        positionFormat = _ref.positionFormat,
        fp64 = _ref.fp64;

    _classCallCheck(this, PathTesselator);

    return _possibleConstructorReturn(this, _getPrototypeOf(PathTesselator).call(this, {
      data: data,
      getGeometry: getGeometry,
      fp64: fp64,
      positionFormat: positionFormat,
      attributes: {
        startPositions: {
          size: 3
        },
        endPositions: {
          size: 3
        },
        leftPositions: {
          size: 3
        },
        rightPositions: {
          size: 3
        },
        startEndPositions64XyLow: {
          size: 4,
          fp64Only: true
        },
        neighborPositions64XyLow: {
          size: 4,
          fp64Only: true
        }
      }
    }));
  }

  _createClass(PathTesselator, [{
    key: "get",
    value: function get(attributeName) {
      return this.attributes[attributeName];
    }
  }, {
    key: "getGeometrySize",
    value: function getGeometrySize(path) {
      return Math.max(0, this.getPathLength(path) - 1);
    }
  }, {
    key: "updateGeometryAttributes",
    value: function updateGeometryAttributes(path, context) {
      var _this$attributes = this.attributes,
          startPositions = _this$attributes.startPositions,
          endPositions = _this$attributes.endPositions,
          leftPositions = _this$attributes.leftPositions,
          rightPositions = _this$attributes.rightPositions,
          startEndPositions64XyLow = _this$attributes.startEndPositions64XyLow,
          neighborPositions64XyLow = _this$attributes.neighborPositions64XyLow,
          fp64 = this.fp64;
      var numPoints = context.geometrySize + 1;

      if (numPoints < 2) {
        return;
      }

      var isPathClosed = this.isClosed(path);
      var startPoint = this.getPointOnPath(path, 0);
      var endPoint = this.getPointOnPath(path, 1);
      var prevPoint = isPathClosed ? this.getPointOnPath(path, numPoints - 2) : startPoint;
      var nextPoint;

      for (var i = context.vertexStart, ptIndex = 1; ptIndex < numPoints; i++, ptIndex++) {
        if (ptIndex + 1 < numPoints) {
          nextPoint = this.getPointOnPath(path, ptIndex + 1);
        } else {
          nextPoint = isPathClosed ? this.getPointOnPath(path, 1) : endPoint;
        }

        startPositions[i * 3] = startPoint[0];
        startPositions[i * 3 + 1] = startPoint[1];
        startPositions[i * 3 + 2] = startPoint[2] || 0;
        endPositions[i * 3] = endPoint[0];
        endPositions[i * 3 + 1] = endPoint[1];
        endPositions[i * 3 + 2] = endPoint[2] || 0;
        leftPositions[i * 3] = prevPoint[0];
        leftPositions[i * 3 + 1] = prevPoint[1];
        leftPositions[i * 3 + 2] = prevPoint[2] || 0;
        rightPositions[i * 3] = nextPoint[0];
        rightPositions[i * 3 + 1] = nextPoint[1];
        rightPositions[i * 3 + 2] = nextPoint[2] || 0;

        if (fp64) {
          startEndPositions64XyLow[i * 4] = fp64LowPart(startPoint[0]);
          startEndPositions64XyLow[i * 4 + 1] = fp64LowPart(startPoint[1]);
          startEndPositions64XyLow[i * 4 + 2] = fp64LowPart(endPoint[0]);
          startEndPositions64XyLow[i * 4 + 3] = fp64LowPart(endPoint[1]);
          neighborPositions64XyLow[i * 4] = fp64LowPart(prevPoint[0]);
          neighborPositions64XyLow[i * 4 + 1] = fp64LowPart(prevPoint[1]);
          neighborPositions64XyLow[i * 4 + 2] = fp64LowPart(nextPoint[0]);
          neighborPositions64XyLow[i * 4 + 3] = fp64LowPart(nextPoint[1]);
        }

        prevPoint = startPoint;
        startPoint = endPoint;
        endPoint = nextPoint;
      }
    }
  }, {
    key: "getPathLength",
    value: function getPathLength(path) {
      if (Number.isFinite(path[0])) {
        return path.length / this.positionSize;
      }

      return path.length;
    }
  }, {
    key: "getPointOnPath",
    value: function getPointOnPath(path, index) {
      if (Number.isFinite(path[0])) {
        var positionSize = this.positionSize;
        return [path[index * positionSize], path[index * positionSize + 1], positionSize === 3 ? path[index * positionSize + 2] : 0];
      }

      return path[index];
    }
  }, {
    key: "isClosed",
    value: function isClosed(path) {
      var numPoints = this.getPathLength(path);
      var firstPoint = this.getPointOnPath(path, 0);
      var lastPoint = this.getPointOnPath(path, numPoints - 1);
      return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] && firstPoint[2] === lastPoint[2];
    }
  }]);

  return PathTesselator;
}(Tesselator);

export { PathTesselator as default };
//# sourceMappingURL=path-tesselator.js.map