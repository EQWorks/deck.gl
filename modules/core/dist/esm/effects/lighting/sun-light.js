import { DirectionalLight } from '@luma.gl/core';
import { getSunlightDirection } from './suncalc';
export default class SunLight extends DirectionalLight {
  constructor(_ref) {
    let {
      timestamp,
      ...others
    } = _ref;
    super(others);
    this.timestamp = timestamp;
  }

  getProjectedLight(_ref2) {
    let {
      layer
    } = _ref2;
    const {
      latitude,
      longitude
    } = layer.context.viewport;
    this.direction = getSunlightDirection(this.timestamp, latitude, longitude);
    return this;
  }

}
//# sourceMappingURL=sun-light.js.map