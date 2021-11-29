import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { h3ToGeoBoundary, h3GetResolution, h3ToGeo, geoToH3, h3IsPentagon, h3Distance, edgeLength, UNITS } from 'h3-js';
import { CompositeLayer, createIterable } from 'kepler-outdated-deck.gl-core';
import { ColumnLayer, PolygonLayer } from 'kepler-outdated-deck.gl-layers';
const UPDATE_THRESHOLD_KM = 10;

function getHexagonCentroid(getHexagon, object, objectInfo) {
  const hexagonId = getHexagon(object, objectInfo);

  const _h3ToGeo = h3ToGeo(hexagonId),
        _h3ToGeo2 = _slicedToArray(_h3ToGeo, 2),
        lat = _h3ToGeo2[0],
        lng = _h3ToGeo2[1];

  return [lng, lat];
}

function h3ToPolygon(hexId) {
  const vertices = h3ToGeoBoundary(hexId, true);
  const refLng = vertices[0][0];

  for (const pt of vertices) {
    const deltaLng = pt[0] - refLng;

    if (deltaLng > 180) {
      pt[0] -= 360;
    } else if (deltaLng < -180) {
      pt[0] += 360;
    }
  }

  return vertices;
}

const defaultProps = Object.assign({}, PolygonLayer.defaultProps, {
  highPrecision: false,
  coverage: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  getHexagon: {
    type: 'accessor',
    value: x => x.hexagon
  },
  extruded: true,
  getColor: null
});
export default class H3HexagonLayer extends CompositeLayer {
  shouldUpdateState(_ref) {
    let changeFlags = _ref.changeFlags;
    return this._shouldUseHighPrecision() ? changeFlags.propsOrDataChanged : changeFlags.somethingChanged;
  }

  updateState(_ref2) {
    let props = _ref2.props,
        oldProps = _ref2.oldProps,
        changeFlags = _ref2.changeFlags;

    if (changeFlags.dataChanged || changeFlags.updateTriggers && changeFlags.updateTriggers.getHexagon) {
      let resolution = -1;
      let hasPentagon = false;

      const _createIterable = createIterable(props.data),
            iterable = _createIterable.iterable,
            objectInfo = _createIterable.objectInfo;

      for (const object of iterable) {
        objectInfo.index++;
        const hexId = props.getHexagon(object, objectInfo);
        resolution = resolution < 0 ? h3GetResolution(hexId) : resolution;

        if (h3IsPentagon(hexId)) {
          hasPentagon = true;
          break;
        }
      }

      this.setState({
        resolution,
        edgeLengthKM: resolution >= 0 ? edgeLength(resolution, UNITS.km) : 0,
        hasPentagon,
        vertices: null
      });
    }

    this._updateVertices(this.context.viewport);
  }

  _shouldUseHighPrecision() {
    const _this$state = this.state,
          resolution = _this$state.resolution,
          hasPentagon = _this$state.hasPentagon;
    return this.props.highPrecision || hasPentagon || resolution >= 0 && resolution <= 5;
  }

  _updateVertices(viewport) {
    if (this._shouldUseHighPrecision()) {
      return;
    }

    const _this$state2 = this.state,
          resolution = _this$state2.resolution,
          edgeLengthKM = _this$state2.edgeLengthKM,
          centerHex = _this$state2.centerHex;

    if (resolution < 0) {
      return;
    }

    const hex = geoToH3(viewport.latitude, viewport.longitude, resolution);

    if (centerHex === hex || centerHex && h3Distance(centerHex, hex) * edgeLengthKM < UPDATE_THRESHOLD_KM) {
      return;
    }

    const pixelsPerMeter = viewport.distanceScales.pixelsPerMeter;
    let vertices = h3ToPolygon(hex);

    const _h3ToGeo3 = h3ToGeo(hex),
          _h3ToGeo4 = _slicedToArray(_h3ToGeo3, 2),
          centerLat = _h3ToGeo4[0],
          centerLng = _h3ToGeo4[1];

    const _viewport$projectFlat = viewport.projectFlat([centerLng, centerLat]),
          _viewport$projectFlat2 = _slicedToArray(_viewport$projectFlat, 2),
          centerX = _viewport$projectFlat2[0],
          centerY = _viewport$projectFlat2[1];

    vertices = vertices.map(p => {
      const worldPosition = viewport.projectFlat(p);
      worldPosition[0] = (worldPosition[0] - centerX) / pixelsPerMeter[0];
      worldPosition[1] = (worldPosition[1] - centerY) / pixelsPerMeter[1];
      return worldPosition;
    });
    this.setState({
      centerHex: hex,
      vertices
    });
  }

  renderLayers() {
    return this._shouldUseHighPrecision() ? this._renderPolygonLayer() : this._renderColumnLayer();
  }

  _getForwardProps() {
    const _this$props = this.props,
          elevationScale = _this$props.elevationScale,
          fp64 = _this$props.fp64,
          material = _this$props.material,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          lineWidthUnits = _this$props.lineWidthUnits,
          lineWidthScale = _this$props.lineWidthScale,
          lineWidthMinPixels = _this$props.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props.lineWidthMaxPixels,
          getColor = _this$props.getColor,
          getFillColor = _this$props.getFillColor,
          getElevation = _this$props.getElevation,
          getLineColor = _this$props.getLineColor,
          getLineWidth = _this$props.getLineWidth,
          updateTriggers = _this$props.updateTriggers;
    return {
      elevationScale,
      fp64,
      extruded,
      wireframe,
      stroked,
      filled,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      material,
      getElevation,
      getFillColor: getColor || getFillColor,
      getLineColor,
      getLineWidth,
      updateTriggers: {
        getFillColor: updateTriggers.getColor || updateTriggers.getFillColor,
        getElevation: updateTriggers.getElevation,
        getLineColor: updateTriggers.getLineColor,
        getLineWidth: updateTriggers.getLineWidth
      }
    };
  }

  _renderPolygonLayer() {
    const _this$props2 = this.props,
          data = _this$props2.data,
          getHexagon = _this$props2.getHexagon,
          updateTriggers = _this$props2.updateTriggers;
    const SubLayerClass = this.getSubLayerClass('hexagon-cell-hifi', PolygonLayer);

    const forwardProps = this._getForwardProps();

    forwardProps.updateTriggers.getPolygon = updateTriggers.getHexagon;
    return new SubLayerClass(forwardProps, this.getSubLayerProps({
      id: 'hexagon-cell-hifi',
      updateTriggers: forwardProps.updateTriggers
    }), {
      data,
      getPolygon: (object, objectInfo) => {
        const hexagonId = getHexagon(object, objectInfo);
        return h3ToPolygon(hexagonId);
      }
    });
  }

  _renderColumnLayer() {
    const _this$props3 = this.props,
          data = _this$props3.data,
          getHexagon = _this$props3.getHexagon,
          updateTriggers = _this$props3.updateTriggers;
    const SubLayerClass = this.getSubLayerClass('hexagon-cell', ColumnLayer);

    const forwardProps = this._getForwardProps();

    forwardProps.updateTriggers.getPosition = updateTriggers.getHexagon;
    return new SubLayerClass(forwardProps, this.getSubLayerProps({
      id: 'hexagon-cell',
      updateTriggers: forwardProps.updateTriggers
    }), {
      data,
      diskResolution: 6,
      radius: 1,
      vertices: this.state.vertices,
      getPosition: getHexagonCentroid.bind(null, getHexagon)
    });
  }

}
H3HexagonLayer.defaultProps = defaultProps;
H3HexagonLayer.layerName = 'H3HexagonLayer';
//# sourceMappingURL=h3-hexagon-layer.js.map