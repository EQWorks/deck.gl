"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class LRUCache {
  constructor() {
    let limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
    this.limit = limit;
    this.clear();
  }

  clear() {
    this._cache = {};
    this._order = [];
  }

  get(key) {
    const value = this._cache[key];

    if (value) {
      this._deleteOrder(key);

      this._appendOrder(key);
    }

    return value;
  }

  set(key, value) {
    if (!this._cache[key]) {
      if (Object.keys(this._cache).length === this.limit) {
        this.delete(this._order[0]);
      }

      this._cache[key] = value;

      this._appendOrder(key);
    } else {
      this.delete(key);
      this._cache[key] = value;

      this._appendOrder(key);
    }
  }

  delete(key) {
    const value = this._cache[key];

    if (value) {
      this._deleteCache(key);

      this._deleteOrder(key);
    }
  }

  _deleteCache(key) {
    delete this._cache[key];
  }

  _deleteOrder(key) {
    const index = this._order.findIndex(o => o === key);

    if (index >= 0) {
      this._order.splice(index, 1);
    }
  }

  _appendOrder(key) {
    this._order.push(key);
  }

}

exports.default = LRUCache;
//# sourceMappingURL=lru-cache.js.map