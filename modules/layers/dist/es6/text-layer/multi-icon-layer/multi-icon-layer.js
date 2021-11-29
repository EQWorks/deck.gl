import { createIterable } from 'kepler-outdated-deck.gl-core';
import IconLayer from '../../icon-layer/icon-layer';
import vs from './multi-icon-layer-vertex.glsl';
import fs from './multi-icon-layer-fragment.glsl';
const DEFAULT_GAMMA = 0.2;
const DEFAULT_BUFFER = 192.0 / 256;
const defaultProps = {
  getShiftInQueue: {
    type: 'accessor',
    value: x => x.shift || 0
  },
  getLengthOfQueue: {
    type: 'accessor',
    value: x => x.len || 1
  },
  getAnchorX: {
    type: 'accessor',
    value: x => x.anchorX || 0
  },
  getAnchorY: {
    type: 'accessor',
    value: x => x.anchorY || 0
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  },
  getPickingIndex: {
    type: 'accessor',
    value: x => x.objectIndex
  }
};
export default class MultiIconLayer extends IconLayer {
  getShaders() {
    return Object.assign({}, super.getShaders(), {
      vs,
      fs
    });
  }

  initializeState() {
    super.initializeState();
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instancePixelOffset: {
        size: 2,
        transition: true,
        accessor: 'getPixelOffset'
      }
    });
  }

  updateState(updateParams) {
    super.updateState(updateParams);
    const changeFlags = updateParams.changeFlags;

    if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.getAnchorX || changeFlags.updateTriggersChanged.getAnchorY)) {
      this.getAttributeManager().invalidate('instanceOffsets');
    }
  }

  draw(_ref) {
    let uniforms = _ref.uniforms;
    const sdf = this.props.sdf;
    super.draw({
      uniforms: Object.assign({}, uniforms, {
        buffer: DEFAULT_BUFFER,
        gamma: DEFAULT_GAMMA,
        sdf: Boolean(sdf)
      })
    });
  }

  calculateInstanceOffsets(attribute, _ref2) {
    let startRow = _ref2.startRow,
        endRow = _ref2.endRow;
    const _this$props = this.props,
          data = _this$props.data,
          iconMapping = _this$props.iconMapping,
          getIcon = _this$props.getIcon,
          getAnchorX = _this$props.getAnchorX,
          getAnchorY = _this$props.getAnchorY,
          getLengthOfQueue = _this$props.getLengthOfQueue,
          getShiftInQueue = _this$props.getShiftInQueue;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable;

    for (const object of iterable) {
      const icon = getIcon(object);
      const rect = iconMapping[icon] || {};
      const len = getLengthOfQueue(object);
      const shiftX = getShiftInQueue(object);
      value[i++] = (getAnchorX(object) - 1) * len / 2 + rect.width / 2 + shiftX || 0;
      value[i++] = rect.height / 2 * getAnchorY(object) || 0;
    }
  }

  calculateInstancePickingColors(attribute, _ref3) {
    let startRow = _ref3.startRow,
        endRow = _ref3.endRow;
    const _this$props2 = this.props,
          data = _this$props2.data,
          getPickingIndex = _this$props2.getPickingIndex;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;
    const pickingColor = [];

    const _createIterable2 = createIterable(data, startRow, endRow),
          iterable = _createIterable2.iterable;

    for (const point of iterable) {
      const index = getPickingIndex(point);
      this.encodePickingColor(index, pickingColor);
      value[i++] = pickingColor[0];
      value[i++] = pickingColor[1];
      value[i++] = pickingColor[2];
    }
  }

}
MultiIconLayer.layerName = 'MultiIconLayer';
MultiIconLayer.defaultProps = defaultProps;
//# sourceMappingURL=multi-icon-layer.js.map