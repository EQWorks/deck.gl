"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.tile2boundingBox = tile2boundingBox;
exports.tile2latLng = tile2latLng;

function tile2latLng(x, y, z) {
  const lng = x / Math.pow(2, z) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

function tile2boundingBox(x, y, z) {
  const [west, north] = tile2latLng(x, y, z);
  const [east, south] = tile2latLng(x + 1, y + 1, z);
  return {
    west,
    north,
    east,
    south
  };
}

class Tile {
  constructor(_ref) {
    let {
      getTileData,
      x,
      y,
      z,
      onTileError
    } = _ref;
    this.x = x;
    this.y = y;
    this.z = z;
    this.bbox = tile2boundingBox(this.x, this.y, this.z);
    this.isVisible = true;
    this.getTileData = getTileData;
    this._data = null;
    this._isLoaded = false;
    this._loader = this._loadData();
    this.onTileError = onTileError;
  }

  get data() {
    if (this._data) {
      return Promise.resolve(this._data);
    }

    return this._loader;
  }

  get isLoaded() {
    return this._isLoaded;
  }

  _loadData() {
    const {
      x,
      y,
      z,
      bbox
    } = this;

    if (!this.getTileData) {
      return null;
    }

    const getTileDataPromise = this.getTileData({
      x,
      y,
      z,
      bbox
    });
    return getTileDataPromise.then(buffers => {
      this._data = buffers;
      this._isLoaded = true;
      return buffers;
    }).catch(err => {
      this._isLoaded = true;
      this.onTileError(err);
    });
  }

  isOverlapped(tile) {
    const {
      x,
      y,
      z
    } = this;
    const m = Math.pow(2, tile.z - z);
    return Math.floor(tile.x / m) === x && Math.floor(tile.y / m) === y;
  }

}

exports.default = Tile;
//# sourceMappingURL=tile.js.map