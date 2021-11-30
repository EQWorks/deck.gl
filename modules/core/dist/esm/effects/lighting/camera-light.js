import PointLight from './point-light';
import { getUniformsFromViewport } from '../../shaderlib/project/viewport-uniforms';
export default class CameraLight extends PointLight {
  getProjectedLight(_ref) {
    let {
      layer
    } = _ref;
    const viewport = layer.context.viewport;
    const {
      coordinateSystem,
      coordinateOrigin,
      modelMatrix
    } = layer.props;
    const {
      project_uCameraPosition
    } = getUniformsFromViewport({
      viewport,
      modelMatrix,
      coordinateSystem,
      coordinateOrigin
    });
    this.projectedLight.color = this.color;
    this.projectedLight.intensity = this.intensity;
    this.projectedLight.position = project_uCameraPosition;
    return this.projectedLight;
  }

}
//# sourceMappingURL=camera-light.js.map