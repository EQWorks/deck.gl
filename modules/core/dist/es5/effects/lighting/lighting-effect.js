"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@luma.gl/core");

var _directionalLight = _interopRequireDefault(require("./directional-light"));

var _effect = _interopRequireDefault(require("../../lib/effect"));

const DefaultAmbientLightProps = {
  color: [255, 255, 255],
  intensity: 1.0
};
const DefaultDirectionalLightProps = [{
  color: [255, 255, 255],
  intensity: 1.0,
  direction: [-1, -3, -1]
}, {
  color: [255, 255, 255],
  intensity: 0.9,
  direction: [1, 8, -2.5]
}];

class LightingEffect extends _effect.default {
  constructor(props) {
    super(props);
    this.ambientLight = null;
    this.directionalLights = [];
    this.pointLights = [];

    for (const key in props) {
      const lightSource = props[key];

      switch (lightSource.type) {
        case 'ambient':
          this.ambientLight = lightSource;
          break;

        case 'directional':
          this.directionalLights.push(lightSource);
          break;

        case 'point':
          this.pointLights.push(lightSource);
          break;

        default:
      }
    }

    this.applyDefaultLights();
  }

  getParameters(layer) {
    const {
      ambientLight
    } = this;
    const pointLights = this.getProjectedPointLights(layer);
    const directionalLights = this.getProjectedDirectionalLights(layer);
    return {
      lightSources: {
        ambientLight,
        directionalLights,
        pointLights
      }
    };
  }

  applyDefaultLights() {
    const {
      ambientLight,
      pointLights,
      directionalLights
    } = this;

    if (!ambientLight && pointLights.length === 0 && directionalLights.length === 0) {
      this.ambientLight = new _core.AmbientLight(DefaultAmbientLightProps);
      this.directionalLights.push(new _directionalLight.default(DefaultDirectionalLightProps[0]));
      this.directionalLights.push(new _directionalLight.default(DefaultDirectionalLightProps[1]));
    }
  }

  getProjectedPointLights(layer) {
    const projectedPointLights = [];

    for (let i = 0; i < this.pointLights.length; i++) {
      const pointLight = this.pointLights[i];
      projectedPointLights.push(pointLight.getProjectedLight({
        layer
      }));
    }

    return projectedPointLights;
  }

  getProjectedDirectionalLights(layer) {
    const projectedDirectionalLights = [];

    for (let i = 0; i < this.directionalLights.length; i++) {
      const directionalLight = this.directionalLights[i];
      projectedDirectionalLights.push(directionalLight.getProjectedLight({
        layer
      }));
    }

    return projectedDirectionalLights;
  }

}

exports.default = LightingEffect;
//# sourceMappingURL=lighting-effect.js.map