import * as Polygon from './polygon';
import { experimental } from 'kepler-outdated-deck.gl-core';
const Tesselator = experimental.Tesselator;
import { fp64 as fp64Module } from '@luma.gl/core';
const fp64LowPart = fp64Module.fp64LowPart;
export default class PolygonTesselator extends Tesselator {
  constructor(_ref) {
    let data = _ref.data,
        getGeometry = _ref.getGeometry,
        fp64 = _ref.fp64,
        positionFormat = _ref.positionFormat,
        _ref$IndexType = _ref.IndexType,
        IndexType = _ref$IndexType === void 0 ? Uint32Array : _ref$IndexType;
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
    let geometryIndex = _ref2.geometryIndex,
        offset = _ref2.vertexStart,
        indexStart = _ref2.indexStart;
    const attributes = this.attributes,
          indexLayout = this.indexLayout,
          typedArrayManager = this.typedArrayManager;
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
    let vertexStart = _ref3.vertexStart,
        geometrySize = _ref3.geometrySize;
    const _this$attributes = this.attributes,
          positions = _this$attributes.positions,
          positions64xyLow = _this$attributes.positions64xyLow,
          vertexValid = _this$attributes.vertexValid,
          fp64 = this.fp64,
          positionSize = this.positionSize;
    let i = vertexStart;
    const polygonPositions = polygon.positions,
          holeIndices = polygon.holeIndices;

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
//# sourceMappingURL=polygon-tesselator.js.map