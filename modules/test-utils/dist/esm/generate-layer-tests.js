import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import { experimental } from 'kepler-outdated-deck.gl-core';
var count = experimental.count;

function defaultAssert(condition, comment) {
  if (!condition) {
    throw new Error(comment);
  }
}

export function generateLayerTests(_ref) {
  var Layer = _ref.Layer,
      _ref$sampleProps = _ref.sampleProps,
      sampleProps = _ref$sampleProps === void 0 ? {} : _ref$sampleProps,
      _ref$assert = _ref.assert,
      assert = _ref$assert === void 0 ? defaultAssert : _ref$assert,
      onBeforeUpdate = _ref.onBeforeUpdate,
      _ref$onAfterUpdate = _ref.onAfterUpdate,
      onAfterUpdate = _ref$onAfterUpdate === void 0 ? function () {} : _ref$onAfterUpdate,
      _ref$runDefaultAssert = _ref.runDefaultAsserts,
      runDefaultAsserts = _ref$runDefaultAssert === void 0 ? true : _ref$runDefaultAssert;
  assert(Layer.layerName, 'Layer should have display name');

  function wrapTestCaseTitle(title) {
    return "".concat(Layer.layerName, "#").concat(title);
  }

  var testCases = [{
    title: 'Empty props',
    props: {}
  }, {
    title: 'Null data',
    updateProps: {
      data: null
    }
  }, {
    title: 'Sample data',
    updateProps: sampleProps
  }];

  try {
    new Layer({});
  } catch (error) {
    assert(false, "Construct ".concat(Layer.layerName, " throws: ").concat(error.message));
  }

  var propTypes = Layer._propTypes,
      defaultProps = Layer._mergedDefaultProps;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = makeAltDataTestCases(sampleProps, propTypes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _step.value,
          title = _step$value.title,
          props = _step$value.props;
      testCases.push({
        title: title,
        updateProps: props
      });
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

  for (var propName in Layer.defaultProps) {
    if (!(propName in sampleProps)) {
      var newTestCase = makeAltPropTestCase(propName, propTypes, defaultProps);

      if (newTestCase) {
        testCases.push({
          title: newTestCase.title,
          updateProps: newTestCase.props
        });
      }
    }
  }

  var _onAfterUpdate = function _onAfterUpdate(params) {
    onAfterUpdate(params);

    if (runDefaultAsserts) {
      if (params.layer.isComposite) {
        if (count(params.layer.props.data)) {
          assert(params.subLayers.length, 'Layer should have sublayers');
        }
      } else {
        assert(params.layer.getModels().length, 'Layer should have models');
      }
    }
  };

  testCases.forEach(function (testCase) {
    testCase.title = wrapTestCaseTitle(testCase.title);
    testCase.onBeforeUpdate = onBeforeUpdate;
    testCase.onAfterUpdate = _onAfterUpdate;
  });
  return testCases;
}

function makeAltPropTestCase(propName, propTypes, defaultProps) {
  var newProps = {};
  var propDef = propTypes[propName];
  var title;

  if (!propDef) {
    return null;
  }

  switch (propDef.type) {
    case 'boolean':
      newProps[propName] = !defaultProps[propName];
      title = String(newProps[propName]);
      break;

    case 'number':
      if ('max' in propDef) {
        newProps[propName] = propDef.max;
      } else if ('min' in propDef) {
        newProps[propName] = propDef.min;
      } else {
        newProps[propName] = defaultProps[propName] + 1;
      }

      title = String(newProps[propName]);
      break;

    case 'accessor':
      if (typeof defaultProps[propName] === 'function') {
        return null;
      }

      newProps[propName] = function () {
        return defaultProps[propName];
      };

      newProps.updateTriggers = _defineProperty({}, propName, propName);
      title = "() => ".concat(defaultProps[propName]);
      break;

    default:
      return null;
  }

  return {
    title: "".concat(propName, ": ").concat(title),
    props: newProps
  };
}

function makeAltDataTestCases(props, propTypes) {
  var originalData = props.data;

  if (!Array.isArray(originalData)) {
    return [];
  }

  var genIterableProps = {
    data: new Set(originalData)
  };
  var nonIterableProps = {
    data: {
      length: originalData.length
    }
  };

  var _loop = function _loop(propName) {
    if (propTypes[propName].type === 'accessor') {
      nonIterableProps[propName] = function (_, info) {
        return props[propName](originalData[info.index], info);
      };
    }
  };

  for (var propName in props) {
    _loop(propName);
  }

  return [{
    title: 'Generic iterable data',
    props: genIterableProps
  }, {
    title: 'non-iterable data',
    props: nonIterableProps
  }];
}
//# sourceMappingURL=generate-layer-tests.js.map