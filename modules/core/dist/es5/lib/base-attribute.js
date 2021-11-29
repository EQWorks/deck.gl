"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

class BaseAttribute {
  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const {
      id = (0, _core.uid)('attribute'),
      type,
      isIndexed = false
    } = opts;
    this.gl = gl;
    this.id = id;
    this.isIndexed = isIndexed;
    this.target = isIndexed ? 34963 : 34962;
    this.type = type;

    if (isIndexed && !type) {
      this.type = gl && (0, _core.hasFeature)(gl, _core.FEATURES.ELEMENT_INDEX_UINT32) ? 5125 : 5123;
    }

    this.value = null;
    this.externalBuffer = null;
    this.buffer = null;
    this.userData = {};
    this.update(opts);

    this._validateAttributeDefinition();
  }

  delete() {
    if (this.buffer) {
      this.buffer.delete();
      this.buffer = null;
    }
  }

  update(opts) {
    const {
      value,
      buffer,
      constant = this.constant || false
    } = opts;
    this.constant = constant;

    if (buffer) {
      this.externalBuffer = buffer;
      this.constant = false;
      this.type = opts.type || buffer.accessor.type;

      if (buffer.accessor.divisor !== undefined) {
        this.divisor = buffer.accessor.divisor;
      }

      if (opts.divisor !== undefined) {
        this.divisor = opts.divisor;
      }
    } else if (value) {
      this.externalBuffer = null;
      const size = this.size || opts.size || 0;

      if (constant && value.length !== size) {
        this.value = new Float32Array(size);
        const index = this.offset / 4;

        for (let i = 0; i < this.size; ++i) {
          this.value[i] = value[index + i];
        }
      } else {
        this.value = value;
      }

      if (!constant && this.gl) {
        this.buffer = this.buffer || this._createBuffer(opts);
        this.buffer.setData({
          data: value
        });
        this.type = this.buffer.accessor.type;
      }
    }

    this._setAccessor(opts);
  }

  getBuffer() {
    if (this.constant) {
      return null;
    }

    return this.externalBuffer || this.buffer;
  }

  getValue() {
    if (this.constant) {
      return this.value;
    }

    const buffer = this.externalBuffer || this.buffer;

    if (buffer) {
      return [buffer, this];
    }

    return null;
  }

  _createBuffer(opts) {
    const props = Object.assign({}, opts, {
      id: this.id,
      target: this.target,
      accessor: {
        type: this.type
      }
    });

    if (Number.isFinite(props.divisor)) {
      props.accessor.divisor = props.divisor;
    }

    delete props.divisor;

    if (Number.isFinite(props.size)) {
      props.accessor.size = props.size;
    }

    delete props.size;
    return new _core.Buffer(this.gl, props);
  }

  _setAccessor(opts) {
    const {
      size = this.size,
      offset = this.offset || 0,
      stride = this.stride || 0,
      normalized = this.normalized || false,
      integer = this.integer || false,
      divisor = this.divisor || 0,
      instanced,
      isInstanced
    } = opts;
    this.size = size;
    this.offset = offset;
    this.stride = stride;
    this.normalized = normalized;
    this.integer = integer;
    this.divisor = divisor;

    if (isInstanced !== undefined) {
      _core.log.deprecated('Attribute.isInstanced')();

      this.divisor = isInstanced ? 1 : 0;
    }

    if (instanced !== undefined) {
      _core.log.deprecated('Attribute.instanced')();

      this.divisor = instanced ? 1 : 0;
    }
  }

  _validateAttributeDefinition() {}

}

exports.default = BaseAttribute;
//# sourceMappingURL=base-attribute.js.map