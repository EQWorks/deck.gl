import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import Layer from './layer';
import log from '../utils/log';
import { flatten } from '../utils/flatten';

var CompositeLayer = function (_Layer) {
  _inherits(CompositeLayer, _Layer);

  function CompositeLayer() {
    _classCallCheck(this, CompositeLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(CompositeLayer).apply(this, arguments));
  }

  _createClass(CompositeLayer, [{
    key: "getSubLayers",
    value: function getSubLayers() {
      return this.internalState && this.internalState.subLayers || [];
    }
  }, {
    key: "initializeState",
    value: function initializeState() {}
  }, {
    key: "setState",
    value: function setState(updateObject) {
      _get(_getPrototypeOf(CompositeLayer.prototype), "setState", this).call(this, updateObject);

      this.setLayerNeedsUpdate();
    }
  }, {
    key: "getPickingInfo",
    value: function getPickingInfo(_ref) {
      var info = _ref.info;
      return info;
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      return null;
    }
  }, {
    key: "shouldRenderSubLayer",
    value: function shouldRenderSubLayer(id, data) {
      var overridingProps = this.props._subLayerProps;
      return data && data.length || overridingProps && overridingProps[id];
    }
  }, {
    key: "getSubLayerClass",
    value: function getSubLayerClass(id, DefaultLayerClass) {
      var overridingProps = this.props._subLayerProps;
      return overridingProps && overridingProps[id] && overridingProps[id].type || DefaultLayerClass;
    }
  }, {
    key: "getSubLayerProps",
    value: function getSubLayerProps(sublayerProps) {
      var _this$props = this.props,
          opacity = _this$props.opacity,
          pickable = _this$props.pickable,
          visible = _this$props.visible,
          parameters = _this$props.parameters,
          getPolygonOffset = _this$props.getPolygonOffset,
          highlightedObjectIndex = _this$props.highlightedObjectIndex,
          autoHighlight = _this$props.autoHighlight,
          highlightColor = _this$props.highlightColor,
          coordinateSystem = _this$props.coordinateSystem,
          coordinateOrigin = _this$props.coordinateOrigin,
          wrapLongitude = _this$props.wrapLongitude,
          positionFormat = _this$props.positionFormat,
          modelMatrix = _this$props.modelMatrix,
          overridingProps = _this$props._subLayerProps;
      var newProps = {
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        parameters: parameters,
        getPolygonOffset: getPolygonOffset,
        highlightedObjectIndex: highlightedObjectIndex,
        autoHighlight: autoHighlight,
        highlightColor: highlightColor,
        coordinateSystem: coordinateSystem,
        coordinateOrigin: coordinateOrigin,
        wrapLongitude: wrapLongitude,
        positionFormat: positionFormat,
        modelMatrix: modelMatrix
      };

      if (sublayerProps) {
        Object.assign(newProps, sublayerProps, overridingProps && overridingProps[sublayerProps.id], {
          id: "".concat(this.props.id, "-").concat(sublayerProps.id),
          updateTriggers: Object.assign({
            all: this.props.updateTriggers.all
          }, sublayerProps.updateTriggers)
        });
      }

      return newProps;
    }
  }, {
    key: "_getAttributeManager",
    value: function _getAttributeManager() {
      return null;
    }
  }, {
    key: "_renderLayers",
    value: function _renderLayers() {
      var subLayers = this.internalState.subLayers;

      if (subLayers && !this.needsUpdate()) {
        log.log(3, "Composite layer reused subLayers ".concat(this), this.internalState.subLayers)();
      } else {
        subLayers = this.renderLayers();
        subLayers = flatten(subLayers, {
          filter: Boolean
        });
        this.internalState.subLayers = subLayers;
        log.log(2, "Composite layer rendered new subLayers ".concat(this), subLayers)();
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = subLayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var layer = _step.value;
          layer.parent = this;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "isComposite",
    get: function get() {
      return true;
    }
  }]);

  return CompositeLayer;
}(Layer);

export { CompositeLayer as default };
CompositeLayer.layerName = 'CompositeLayer';
//# sourceMappingURL=composite-layer.js.map