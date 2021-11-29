import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer, createIterable } from 'kepler-outdated-deck.gl-core';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import PathLayer from '../path-layer/path-layer';
import * as Polygon from '../solid-polygon-layer/polygon';
const defaultLineColor = [0, 0, 0, 255];
const defaultFillColor = [0, 0, 0, 255];
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  elevationScale: 1,
  wireframe: false,
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  lineDashJustified: false,
  fp64: false,
  getPolygon: {
    type: 'accessor',
    value: f => f.polygon
  },
  getFillColor: {
    type: 'accessor',
    value: defaultFillColor
  },
  getLineColor: {
    type: 'accessor',
    value: defaultLineColor
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  },
  getLineDashArray: {
    type: 'accessor',
    value: [0, 0]
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  material: defaultMaterial
};
export default class PolygonLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      paths: []
    };
  }

  updateState(_ref) {
    let oldProps = _ref.oldProps,
        props = _ref.props,
        changeFlags = _ref.changeFlags;
    const geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

    if (geometryChanged) {
      this.state.paths = this._getPaths(props);
    }
  }

  getPickingInfo(_ref2) {
    let info = _ref2.info;
    return Object.assign(info, {
      object: info.object && info.object.object || info.object
    });
  }

  _getPaths(_ref3) {
    let data = _ref3.data,
        getPolygon = _ref3.getPolygon,
        positionFormat = _ref3.positionFormat;
    const paths = [];
    const positionSize = positionFormat === 'XY' ? 2 : 3;

    const _createIterable = createIterable(data),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;

      const _Polygon$normalize = Polygon.normalize(getPolygon(object, objectInfo), positionSize),
            positions = _Polygon$normalize.positions,
            holeIndices = _Polygon$normalize.holeIndices;

      if (holeIndices) {
        for (let i = 0; i <= holeIndices.length; i++) {
          const path = positions.subarray(holeIndices[i - 1] || 0, holeIndices[i] || positions.length);
          paths.push({
            path,
            object
          });
        }
      } else {
        paths.push({
          path: positions,
          object
        });
      }
    }

    return paths;
  }

  _getAccessor(accessor) {
    if (typeof accessor === 'function') {
      return x => accessor(x.object);
    }

    return accessor;
  }

  renderLayers() {
    const _this$props = this.props,
          data = _this$props.data,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          elevationScale = _this$props.elevationScale,
          transitions = _this$props.transitions;
    const _this$props2 = this.props,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          lineDashJustified = _this$props2.lineDashJustified,
          fp64 = _this$props2.fp64;
    const _this$props3 = this.props,
          getFillColor = _this$props3.getFillColor,
          getLineColor = _this$props3.getLineColor,
          getLineWidth = _this$props3.getLineWidth,
          getLineDashArray = _this$props3.getLineDashArray,
          getElevation = _this$props3.getElevation,
          getPolygon = _this$props3.getPolygon,
          updateTriggers = _this$props3.updateTriggers,
          material = _this$props3.material;
    const paths = this.state.paths;
    const FillLayer = this.getSubLayerClass('fill', SolidPolygonLayer);
    const StrokeLayer = this.getSubLayerClass('stroke', PathLayer);
    const polygonLayer = this.shouldRenderSubLayer('fill', paths) && new FillLayer({
      extruded,
      elevationScale,
      fp64,
      filled,
      wireframe,
      getElevation,
      getFillColor,
      getLineColor,
      material,
      transitions
    }, this.getSubLayerProps({
      id: 'fill',
      updateTriggers: {
        getPolygon: updateTriggers.getPolygon,
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor
      }
    }), {
      data,
      getPolygon
    });
    const polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('stroke', paths) && new StrokeLayer({
      fp64,
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      transitions: transitions && {
        getWidth: transitions.getLineWidth,
        getColor: transitions.getLineColor,
        getPath: transitions.getPolygon
      },
      getColor: this._getAccessor(getLineColor),
      getWidth: this._getAccessor(getLineWidth),
      getDashArray: this._getAccessor(getLineDashArray)
    }, this.getSubLayerProps({
      id: 'stroke',
      updateTriggers: {
        getWidth: updateTriggers.getLineWidth,
        getColor: updateTriggers.getLineColor,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: paths,
      getPath: x => x.path
    });
    return [!extruded && polygonLayer, polygonLineLayer, extruded && polygonLayer];
  }

}
PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=polygon-layer.js.map