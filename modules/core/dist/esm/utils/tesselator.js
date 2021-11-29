import { createIterable } from './iterable-utils';

class TypedArrayManager {
  constructor() {
    let {
      overAlloc = 1
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.overAlloc = overAlloc;
  }

  allocate(typedArray, count, _ref) {
    let {
      size,
      type,
      copy = false
    } = _ref;
    const newSize = count * size;

    if (typedArray && newSize <= typedArray.length) {
      return typedArray;
    }

    const allocSize = Math.max(Math.ceil(newSize * this.overAlloc), 1);

    const newArray = this._allocate(type, allocSize);

    if (typedArray && copy) {
      newArray.set(typedArray);
    }

    this._release(typedArray);

    return newArray;
  }

  _allocate() {
    let Type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Float32Array;
    let size = arguments.length > 1 ? arguments[1] : undefined;
    return new Type(size);
  }

  _release(typedArray) {}

}

export default class Tesselator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      attributes = {}
    } = opts;
    this.typedArrayManager = new TypedArrayManager();
    this.indexLayout = null;
    this.bufferLayout = null;
    this.vertexCount = 0;
    this.instanceCount = 0;
    this.attributes = {};
    this._attributeDefs = attributes;
    this.updateGeometry(opts);
    Object.seal(this);
  }

  updateGeometry(_ref2) {
    let {
      data,
      getGeometry,
      positionFormat,
      fp64
    } = _ref2;
    this.data = data;
    this.getGeometry = getGeometry;
    this.fp64 = fp64;
    this.positionSize = positionFormat === 'XY' ? 2 : 3;

    this._rebuildGeometry();
  }

  updatePartialGeometry(_ref3) {
    let {
      startRow,
      endRow
    } = _ref3;

    this._rebuildGeometry({
      startRow,
      endRow
    });
  }

  updateGeometryAttributes(geometry, startIndex, size) {
    throw new Error('Not implemented');
  }

  getGeometrySize(geometry) {
    throw new Error('Not implemented');
  }

  _forEachGeometry(visitor, startRow, endRow) {
    const {
      data,
      getGeometry
    } = this;
    const {
      iterable,
      objectInfo
    } = createIterable(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      const geometry = getGeometry(object, objectInfo);
      visitor(geometry, objectInfo.index);
    }
  }

  _rebuildGeometry(dataRange) {
    if (!this.data || !this.getGeometry) {
      return;
    }

    let {
      indexLayout,
      bufferLayout
    } = this;

    if (!dataRange) {
      indexLayout = [];
      bufferLayout = [];
    }

    const {
      startRow = 0,
      endRow = Infinity
    } = dataRange || {};

    this._forEachGeometry((geometry, dataIndex) => {
      bufferLayout[dataIndex] = this.getGeometrySize(geometry);
    }, startRow, endRow);

    let instanceCount = 0;

    for (const count of bufferLayout) {
      instanceCount += count;
    }

    const {
      attributes,
      _attributeDefs,
      typedArrayManager,
      fp64
    } = this;

    for (const name in _attributeDefs) {
      const def = _attributeDefs[name];
      def.copy = Boolean(dataRange);

      if (!def.fp64Only || fp64) {
        attributes[name] = typedArrayManager.allocate(attributes[name], instanceCount, def);
      }
    }

    this.indexLayout = indexLayout;
    this.bufferLayout = bufferLayout;
    this.instanceCount = instanceCount;
    const context = {
      vertexStart: 0,
      indexStart: 0
    };

    for (let i = 0; i < startRow; i++) {
      context.vertexStart += bufferLayout[i];
      context.indexStart += indexLayout[i] || 0;
    }

    this._forEachGeometry((geometry, dataIndex) => {
      const geometrySize = bufferLayout[dataIndex];
      context.geometryIndex = dataIndex;
      context.geometrySize = geometrySize;
      this.updateGeometryAttributes(geometry, context);
      context.vertexStart += geometrySize;
      context.indexStart += indexLayout[dataIndex] || 0;
    }, startRow, endRow);

    let vertexCount = context.indexStart;

    for (let i = endRow; i < indexLayout.length; i++) {
      vertexCount += indexLayout[i];
    }

    this.vertexCount = vertexCount;
  }

}
//# sourceMappingURL=tesselator.js.map