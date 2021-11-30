"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var _keplerOutdatedDeck2 = require("kepler-outdated-deck.gl-layers");

var _tileCache = _interopRequireDefault(require("./utils/tile-cache"));

const defaultProps = {
  renderSubLayers: {
    type: 'function',
    value: props => new _keplerOutdatedDeck2.GeoJsonLayer(props)
  },
  getTileData: {
    type: 'function',
    value: _ref => {
      let {
        x,
        y,
        z
      } = _ref;
      return Promise.resolve(null);
    }
  },
  onViewportLoaded: {
    type: 'function',
    value: () => {}
  },
  onTileError: {
    type: 'function',
    value: err => console.error(err)
  },
  maxZoom: null,
  minZoom: 0,
  maxCacheSize: null
};

class TileLayer extends _keplerOutdatedDeck.CompositeLayer {
  initializeState() {
    const {
      maxZoom,
      minZoom,
      getTileData,
      onTileError
    } = this.props;
    this.state = {
      tiles: [],
      tileCache: new _tileCache.default({
        getTileData,
        maxZoom,
        minZoom,
        onTileError
      }),
      isLoaded: false
    };
  }

  shouldUpdateState(_ref2) {
    let {
      changeFlags
    } = _ref2;
    return changeFlags.somethingChanged;
  }

  updateState(_ref3) {
    let {
      props,
      oldProps,
      context,
      changeFlags
    } = _ref3;
    const {
      onViewportLoaded,
      onTileError
    } = props;

    if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getTileData)) {
      const {
        getTileData,
        maxZoom,
        minZoom,
        maxCacheSize
      } = props;
      this.state.tileCache.finalize();
      this.setState({
        tileCache: new _tileCache.default({
          getTileData,
          maxSize: maxCacheSize,
          maxZoom,
          minZoom,
          onTileError
        })
      });
    }

    if (changeFlags.viewportChanged) {
      const {
        viewport
      } = context;
      const z = this.getLayerZoomLevel();

      if (viewport.id !== 'DEFAULT-INITIAL-VIEWPORT') {
        this.state.tileCache.update(viewport, tiles => {
          const currTiles = tiles.filter(tile => tile.z === z);
          const allCurrTilesLoaded = currTiles.every(tile => tile.isLoaded);
          this.setState({
            tiles,
            isLoaded: allCurrTilesLoaded
          });

          if (!allCurrTilesLoaded) {
            Promise.all(currTiles.map(tile => tile.data)).then(() => {
              this.setState({
                isLoaded: true
              });
              onViewportLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
            });
          } else {
            onViewportLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
          }
        });
      }
    }
  }

  getPickingInfo(_ref4) {
    let {
      info,
      sourceLayer
    } = _ref4;
    info.sourceLayer = sourceLayer;
    info.tile = sourceLayer.props.tile;
    return info;
  }

  getLayerZoomLevel() {
    const z = Math.floor(this.context.viewport.zoom);
    const {
      maxZoom,
      minZoom
    } = this.props;

    if (maxZoom && parseInt(maxZoom, 10) === maxZoom && z > maxZoom) {
      return maxZoom;
    } else if (minZoom && parseInt(minZoom, 10) === minZoom && z < minZoom) {
      return minZoom;
    }

    return z;
  }

  renderLayers() {
    const {
      renderSubLayers,
      visible
    } = this.props;
    const z = this.getLayerZoomLevel();
    return this.state.tiles.map(tile => {
      return renderSubLayers(Object.assign({}, this.props, {
        id: "".concat(this.id, "-").concat(tile.x, "-").concat(tile.y, "-").concat(tile.z),
        data: tile.data,
        visible: visible && (!this.state.isLoaded || tile.z === z),
        tile
      }));
    });
  }

}

exports.default = TileLayer;
TileLayer.layerName = 'TileLayer';
TileLayer.defaultProps = defaultProps;
//# sourceMappingURL=tile-layer.js.map