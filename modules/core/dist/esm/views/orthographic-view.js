import View from './view';
import Viewport from '../viewports/viewport';
import { Matrix4 } from 'math.gl';
import OrthographicController from '../controllers/orthographic-controller';
const viewMatrix = new Matrix4().lookAt({
  eye: [0, 0, 1]
});

function getProjectionMatrix(_ref) {
  let {
    width,
    height,
    near,
    far
  } = _ref;
  width = width || 1;
  height = height || 1;
  return new Matrix4().ortho({
    left: -width / 2,
    right: width / 2,
    bottom: height / 2,
    top: -height / 2,
    near,
    far
  });
}

class OrthographicViewport extends Viewport {
  constructor(_ref2) {
    let {
      id,
      x,
      y,
      width,
      height,
      near = 0.1,
      far = 1000,
      zoom = 0,
      target = [0, 0, 0]
    } = _ref2;
    return new Viewport({
      id,
      x,
      y,
      width,
      height,
      position: target,
      viewMatrix,
      projectionMatrix: getProjectionMatrix({
        width,
        height,
        near,
        far
      }),
      zoom
    });
  }

}

export default class OrthographicView extends View {
  constructor(props) {
    super(Object.assign({}, props, {
      type: OrthographicViewport
    }));
  }

  get controller() {
    return this._getControllerProps({
      type: OrthographicController,
      ViewportType: OrthographicViewport
    });
  }

}
OrthographicView.displayName = 'OrthographicView';
//# sourceMappingURL=orthographic-view.js.map