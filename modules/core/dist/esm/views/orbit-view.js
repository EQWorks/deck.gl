import View from './view';
import Viewport from '../viewports/viewport';
import { Matrix4 } from 'math.gl';
import OrbitController from '../controllers/orbit-controller';
const DEGREES_TO_RADIANS = Math.PI / 180;

function getViewMatrix(_ref) {
  let {
    height,
    fovy,
    orbitAxis,
    rotationX,
    rotationOrbit,
    zoom
  } = _ref;
  const distance = 0.5 / Math.tan(fovy * DEGREES_TO_RADIANS / 2);
  const viewMatrix = new Matrix4().lookAt({
    eye: [0, 0, distance]
  });
  viewMatrix.rotateX(rotationX * DEGREES_TO_RADIANS);

  if (orbitAxis === 'Z') {
    viewMatrix.rotateZ(rotationOrbit * DEGREES_TO_RADIANS);
  } else {
    viewMatrix.rotateY(rotationOrbit * DEGREES_TO_RADIANS);
  }

  const projectionScale = 1 / (height || 1);
  viewMatrix.scale([projectionScale, projectionScale, projectionScale]);
  return viewMatrix;
}

class OrbitViewport extends Viewport {
  constructor(props) {
    const {
      id,
      x,
      y,
      width,
      height,
      fovy = 50,
      near,
      far,
      orbitAxis = 'Z',
      target = [0, 0, 0],
      rotationX = 0,
      rotationOrbit = 0,
      zoom = 0
    } = props;
    super({
      id,
      viewMatrix: getViewMatrix({
        height,
        fovy,
        orbitAxis,
        rotationX,
        rotationOrbit,
        zoom
      }),
      fovy,
      near,
      far,
      x,
      y,
      position: target,
      width,
      height,
      zoom
    });
  }

}

export default class OrbitView extends View {
  constructor(props) {
    super(Object.assign({}, props, {
      type: OrbitViewport
    }));
  }

  get controller() {
    return this._getControllerProps({
      type: OrbitController,
      ViewportType: OrbitViewport
    });
  }

}
OrbitView.displayName = 'OrbitView';
//# sourceMappingURL=orbit-view.js.map