import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { AmbientLight } from '@luma.gl/core';
import DirectionalLight from './directional-light';
import Effect from '../../lib/effect';
var DefaultAmbientLightProps = {
  color: [255, 255, 255],
  intensity: 1.0
};
var DefaultDirectionalLightProps = [{
  color: [255, 255, 255],
  intensity: 1.0,
  direction: [-1, -3, -1]
}, {
  color: [255, 255, 255],
  intensity: 0.9,
  direction: [1, 8, -2.5]
}];

var LightingEffect = function (_Effect) {
  _inherits(LightingEffect, _Effect);

  function LightingEffect(props) {
    var _this;

    _classCallCheck(this, LightingEffect);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(LightingEffect).call(this, props));
    _this.ambientLight = null;
    _this.directionalLights = [];
    _this.pointLights = [];

    for (var key in props) {
      var lightSource = props[key];

      switch (lightSource.type) {
        case 'ambient':
          _this.ambientLight = lightSource;
          break;

        case 'directional':
          _this.directionalLights.push(lightSource);

          break;

        case 'point':
          _this.pointLights.push(lightSource);

          break;

        default:
      }
    }

    _this.applyDefaultLights();

    return _this;
  }

  _createClass(LightingEffect, [{
    key: "getParameters",
    value: function getParameters(layer) {
      var ambientLight = this.ambientLight;
      var pointLights = this.getProjectedPointLights(layer);
      var directionalLights = this.getProjectedDirectionalLights(layer);
      return {
        lightSources: {
          ambientLight: ambientLight,
          directionalLights: directionalLights,
          pointLights: pointLights
        }
      };
    }
  }, {
    key: "applyDefaultLights",
    value: function applyDefaultLights() {
      var ambientLight = this.ambientLight,
          pointLights = this.pointLights,
          directionalLights = this.directionalLights;

      if (!ambientLight && pointLights.length === 0 && directionalLights.length === 0) {
        this.ambientLight = new AmbientLight(DefaultAmbientLightProps);
        this.directionalLights.push(new DirectionalLight(DefaultDirectionalLightProps[0]));
        this.directionalLights.push(new DirectionalLight(DefaultDirectionalLightProps[1]));
      }
    }
  }, {
    key: "getProjectedPointLights",
    value: function getProjectedPointLights(layer) {
      var projectedPointLights = [];

      for (var i = 0; i < this.pointLights.length; i++) {
        var pointLight = this.pointLights[i];
        projectedPointLights.push(pointLight.getProjectedLight({
          layer: layer
        }));
      }

      return projectedPointLights;
    }
  }, {
    key: "getProjectedDirectionalLights",
    value: function getProjectedDirectionalLights(layer) {
      var projectedDirectionalLights = [];

      for (var i = 0; i < this.directionalLights.length; i++) {
        var directionalLight = this.directionalLights[i];
        projectedDirectionalLights.push(directionalLight.getProjectedLight({
          layer: layer
        }));
      }

      return projectedDirectionalLights;
    }
  }]);

  return LightingEffect;
}(Effect);

export { LightingEffect as default };
//# sourceMappingURL=lighting-effect.js.map