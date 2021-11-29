import View from './view';
import Viewport from '../viewports/viewport';
import { Vector3, Matrix4, _SphericalCoordinates as SphericalCoordinates } from 'math.gl';

function getDirectionFromBearingAndPitch(_ref) {
  let {
    bearing,
    pitch
  } = _ref;
  const spherical = new SphericalCoordinates({
    bearing,
    pitch
  });
  return spherical.toVector3().normalize();
}

export default class ThirdPersonView extends View {
  _getViewport(props) {
    const {
      bearing,
      pitch,
      position,
      up,
      zoom
    } = props.viewState;
    const direction = getDirectionFromBearingAndPitch({
      bearing,
      pitch
    });
    const distance = zoom * 50;
    const eye = direction.scale(-distance).multiply(new Vector3(1, 1, -1));
    const viewMatrix = new Matrix4().multiplyRight(new Matrix4().lookAt({
      eye,
      center: position,
      up
    }));
    return new Viewport(Object.assign({}, props, {
      id: this.id,
      zoom: null,
      viewMatrix
    }));
  }

}
ThirdPersonView.displayName = 'ThirdPersonView';
//# sourceMappingURL=third-person-view.js.map