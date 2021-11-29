"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateLayerInSeer = exports.setPropOverrides = exports.seerInitListener = exports.removeLayerInSeer = exports.layerEditListener = exports.initLayerInSeer = exports.applyPropOverrides = void 0;

var _seer = _interopRequireDefault(require("seer"));

const recursiveSet = (obj, path, value) => {
  if (!obj) {
    return;
  }

  if (path.length > 1) {
    recursiveSet(obj[path[0]], path.slice(1), value);
  } else {
    obj[path[0]] = value;
  }
};

const overrides = new Map();

const setPropOverrides = (id, valuePath, value) => {
  if (!_seer.default.isReady()) {
    return;
  }

  if (!overrides.has(id)) {
    overrides.set(id, new Map());
  }

  const props = overrides.get(id);
  props.set(valuePath, value);
};

exports.setPropOverrides = setPropOverrides;

const applyPropOverrides = props => {
  if (!_seer.default.isReady() || !props.id) {
    return;
  }

  const overs = overrides.get(props.id);

  if (!overs) {
    return;
  }

  overs.forEach((value, valuePath) => {
    recursiveSet(props, valuePath, value);

    if (valuePath[0] === 'data') {
      props.data = [...props.data];
    }
  });
};

exports.applyPropOverrides = applyPropOverrides;

const layerEditListener = cb => {
  if (!_seer.default.isReady()) {
    return;
  }

  _seer.default.listenFor('deck.gl', cb);
};

exports.layerEditListener = layerEditListener;

const seerInitListener = cb => {
  if (!_seer.default.isReady()) {
    return;
  }

  _seer.default.listenFor('init', cb);
};

exports.seerInitListener = seerInitListener;

const initLayerInSeer = layer => {
  if (!_seer.default.isReady() || !layer) {
    return;
  }

  const badges = [layer.constructor.layerName];

  _seer.default.listItem('deck.gl', layer.id, {
    badges,
    links: layer.state && layer.state.model ? ["luma.gl:".concat(layer.state.model.id)] : undefined,
    parent: layer.parent ? layer.parent.id : undefined
  });
};

exports.initLayerInSeer = initLayerInSeer;

const updateLayerInSeer = layer => {
  if (!_seer.default.isReady() || _seer.default.throttle("deck.gl:".concat(layer.id), 1e3)) {
    return;
  }

  const data = logPayload(layer);

  _seer.default.multiUpdate('deck.gl', layer.id, data);
};

exports.updateLayerInSeer = updateLayerInSeer;

const removeLayerInSeer = id => {
  if (!_seer.default.isReady() || !id) {
    return;
  }

  _seer.default.deleteItem('deck.gl', id);
};

exports.removeLayerInSeer = removeLayerInSeer;

function logPayload(layer) {
  const data = [{
    path: 'objects.props',
    data: layer.props
  }];
  const badges = [layer.constructor.layerName];

  if (layer.state) {
    if (layer.getAttributeManager()) {
      const attrs = layer.getAttributeManager().getAttributes();
      data.push({
        path: 'objects.attributes',
        data: attrs
      });
    }

    if (layer.state.model) {
      layer.state.model.setProps({
        timerQueryEnabled: true
      });
      const {
        lastFrameTime
      } = layer.state.model.stats;

      if (lastFrameTime) {
        badges.push("".concat((lastFrameTime * 1000).toFixed(0), "\u03BCs"));
      }
    }
  }

  data.push({
    path: 'badges',
    data: badges
  });
  return data;
}
//# sourceMappingURL=seer-integration.js.map