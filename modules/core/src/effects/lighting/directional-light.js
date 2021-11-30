import { DirectionalLight as BaseDirectionalLight } from 'kepler-outdated-luma.gl-core';

export default class DirectionalLight extends BaseDirectionalLight {
  getProjectedLight() {
    return this;
  }
}
