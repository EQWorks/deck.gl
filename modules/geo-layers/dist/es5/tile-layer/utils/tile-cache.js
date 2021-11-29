"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _tile = _interopRequireDefault(require("./tile"));

var _viewportUtil = require("./viewport-util");

class TileCache {
  constructor(_ref) {
    let {
      getTileData,
      maxSize,
      maxZoom,
      minZoom,
      onTileError
    } = _ref;
    this._getTileData = getTileData;
    this._maxSize = maxSize;
    this.onTileError = onTileError;
    this._cache = new Map();

    if (maxZoom && parseInt(maxZoom, 10) === maxZoom) {
      this._maxZoom = maxZoom;
    }

    if (minZoom && parseInt(minZoom, 10) === minZoom) {
      this._minZoom = minZoom;
    }
  }

  finalize() {
    this._cache.clear();
  }

  update(viewport, onUpdate) {
    const {
      _cache,
      _getTileData,
      _maxSize,
      _maxZoom,
      _minZoom
    } = this;

    this._markOldTiles();

    const tileIndices = (0, _viewportUtil.getTileIndices)(viewport, _maxZoom, _minZoom);

    if (!tileIndices || tileIndices.length === 0) {
      onUpdate(tileIndices);
      return;
    }

    const viewportTiles = new Set();

    _cache.forEach(cachedTile => {
      if (tileIndices.some(tile => cachedTile.isOverlapped(tile))) {
        cachedTile.isVisible = true;
        viewportTiles.add(cachedTile);
      }
    });

    for (let i = 0; i < tileIndices.length; i++) {
      const tileIndex = tileIndices[i];
      const {
        x,
        y,
        z
      } = tileIndex;

      let tile = this._getTile(x, y, z);

      if (!tile) {
        tile = new _tile.default({
          getTileData: _getTileData,
          x,
          y,
          z,
          onTileError: this.onTileError
        });
      }

      const tileId = this._getTileId(x, y, z);

      _cache.set(tileId, tile);

      viewportTiles.add(tile);
    }

    const commonZoomRange = 5;

    this._resizeCache(_maxSize || commonZoomRange * tileIndices.length);

    const viewportTilesArray = Array.from(viewportTiles).sort((t1, t2) => t1.z - t2.z);
    onUpdate(viewportTilesArray);
  }

  _resizeCache(maxSize) {
    const {
      _cache
    } = this;

    if (_cache.size > maxSize) {
      const iterator = _cache[Symbol.iterator]();

      for (const cachedTile of iterator) {
        if (_cache.size <= maxSize) {
          break;
        }

        const tileId = cachedTile[0];
        const tile = cachedTile[1];

        if (!tile.isVisible) {
          _cache.delete(tileId);
        }
      }
    }
  }

  _markOldTiles() {
    this._cache.forEach(cachedTile => {
      cachedTile.isVisible = false;
    });
  }

  _getTile(x, y, z) {
    const tileId = this._getTileId(x, y, z);

    return this._cache.get(tileId);
  }

  _getTileId(x, y, z) {
    return "".concat(z, "-").concat(x, "-").concat(y);
  }

}

exports.default = TileCache;
//# sourceMappingURL=tile-cache.js.map