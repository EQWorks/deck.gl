"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var Polygon = _interopRequireWildcard(require("./polygon"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const {
  Tesselator
} = _keplerOutdatedDeck.experimental;
const {
  fp64LowPart
} = _keplerOutdatedLuma.fp64;

class PolygonTesselator extends Tesselator {
  constructor(_ref) {
    let {
      data,
      getGeometry,
      fp64,
      positionFormat,
      IndexType = Uint32Array
    } = _ref;
    super({
      data,
      getGeometry,
      fp64,
      positionFormat,
      attributes: {
        positions: {
          size: 3
        },
        positions64xyLow: {
          size: 2,
          fp64Only: true
        },
        vertexValid: {
          type: Uint8ClampedArray,
          size: 1
        },
        indices: {
          type: IndexType,
          size: 1
        }
      }
    });
  }

  get(attributeName) {
    if (attributeName === 'indices') {
      return this.attributes.indices.subarray(0, this.vertexCount);
    }

    return this.attributes[attributeName];
  }

  getGeometrySize(polygon) {
    return Polygon.getVertexCount(polygon, this.positionSize);
  }

  updateGeometryAttributes(polygon, context) {
    polygon = Polygon.normalize(polygon, this.positionSize, context.geometrySize);

    this._updateIndices(polygon, context);

    this._updatePositions(polygon, context);
  }

  _updateIndices(polygon, _ref2) {
    let {
      geometryIndex,
      vertexStart: offset,
      indexStart
    } = _ref2;
    const {
      attributes,
      indexLayout,
      typedArrayManager
    } = this;
    let target = attributes.indices;
    let currentLength = target.length;
    let i = indexStart;
    const indices = Polygon.getSurfaceIndices(polygon, this.positionSize);

    if (currentLength < i + indices.length) {
      currentLength = (i + indices.length) * 2;
      target = typedArrayManager.allocate(target, currentLength, {
        type: target.constructor,
        size: 1,
        copy: true
      });
    }

    for (let j = 0; j < indices.length; j++) {
      target[i++] = indices[j] + offset;
    }

    indexLayout[geometryIndex] = indices.length;
    attributes.indices = target;
  }

  _updatePositions(polygon, _ref3) {
    let {
      vertexStart,
      geometrySize
    } = _ref3;
    const {
      attributes: {
        positions,
        positions64xyLow,
        vertexValid
      },
      fp64,
      positionSize
    } = this;
    let i = vertexStart;
    const {
      positions: polygonPositions,
      holeIndices
    } = polygon;

    for (let j = 0; j < geometrySize; j++) {
      const x = polygonPositions[j * positionSize];
      const y = polygonPositions[j * positionSize + 1];
      const z = positionSize > 2 ? polygonPositions[j * positionSize + 2] : 0;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      if (fp64) {
        positions64xyLow[i * 2] = fp64LowPart(x);
        positions64xyLow[i * 2 + 1] = fp64LowPart(y);
      }

      vertexValid[i] = 1;
      i++;
    }

    if (holeIndices) {
      for (let j = 0; j < holeIndices.length; j++) {
        vertexValid[vertexStart + holeIndices[j] / positionSize - 1] = 0;
      }
    }

    vertexValid[vertexStart + geometrySize - 1] = 0;
  }

}

exports.default = PolygonTesselator;
//# sourceMappingURL=polygon-tesselator.js.map