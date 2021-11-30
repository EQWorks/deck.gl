"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedLuma = require("kepler-outdated-luma.gl-core");

var _columnLayer = _interopRequireDefault(require("./column-layer"));

const defaultProps = {
  cellSize: {
    type: 'number',
    min: 0,
    value: 1000
  },
  offset: {
    type: 'array',
    min: 0,
    value: [1, 1]
  }
};

class GridCellLayer extends _columnLayer.default {
  getGeometry(diskResolution) {
    return new _keplerOutdatedLuma.CubeGeometry();
  }

  draw(_ref) {
    let {
      uniforms
    } = _ref;
    const {
      elevationScale,
      extruded,
      offset,
      coverage,
      cellSize,
      angle
    } = this.props;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      radius: cellSize / 2,
      angle,
      offset,
      extruded,
      coverage,
      elevationScale,
      edgeDistance: 1,
      isWireframe: false
    })).draw();
  }

}

exports.default = GridCellLayer;
GridCellLayer.layerName = 'GridCellLayer';
GridCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=grid-cell-layer.js.map