import { experimental } from 'kepler-outdated-deck.gl-core';
const count = experimental.count;

function defaultAssert(condition, comment) {
  if (!condition) {
    throw new Error(comment);
  }
}

export function generateLayerTests(_ref) {
  let Layer = _ref.Layer,
      _ref$sampleProps = _ref.sampleProps,
      sampleProps = _ref$sampleProps === void 0 ? {} : _ref$sampleProps,
      _ref$assert = _ref.assert,
      assert = _ref$assert === void 0 ? defaultAssert : _ref$assert,
      onBeforeUpdate = _ref.onBeforeUpdate,
      _ref$onAfterUpdate = _ref.onAfterUpdate,
      onAfterUpdate = _ref$onAfterUpdate === void 0 ? () => {} : _ref$onAfterUpdate,
      _ref$runDefaultAssert = _ref.runDefaultAsserts,
      runDefaultAsserts = _ref$runDefaultAssert === void 0 ? true : _ref$runDefaultAssert;
  assert(Layer.layerName, 'Layer should have display name');

  function wrapTestCaseTitle(title) {
    return `${Layer.layerName}#${title}`;
  }

  const testCases = [{
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
    assert(false, `Construct ${Layer.layerName} throws: ${error.message}`);
  }

  const propTypes = Layer._propTypes,
        defaultProps = Layer._mergedDefaultProps;

  for (const _ref2 of makeAltDataTestCases(sampleProps, propTypes)) {
    const title = _ref2.title;
    const props = _ref2.props;
    testCases.push({
      title,
      updateProps: props
    });
  }

  for (const propName in Layer.defaultProps) {
    if (!(propName in sampleProps)) {
      const newTestCase = makeAltPropTestCase(propName, propTypes, defaultProps);

      if (newTestCase) {
        testCases.push({
          title: newTestCase.title,
          updateProps: newTestCase.props
        });
      }
    }
  }

  const _onAfterUpdate = params => {
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

  testCases.forEach(testCase => {
    testCase.title = wrapTestCaseTitle(testCase.title);
    testCase.onBeforeUpdate = onBeforeUpdate;
    testCase.onAfterUpdate = _onAfterUpdate;
  });
  return testCases;
}

function makeAltPropTestCase(propName, propTypes, defaultProps) {
  const newProps = {};
  const propDef = propTypes[propName];
  let title;

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

      newProps[propName] = () => defaultProps[propName];

      newProps.updateTriggers = {
        [propName]: propName
      };
      title = `() => ${defaultProps[propName]}`;
      break;

    default:
      return null;
  }

  return {
    title: `${propName}: ${title}`,
    props: newProps
  };
}

function makeAltDataTestCases(props, propTypes) {
  const originalData = props.data;

  if (!Array.isArray(originalData)) {
    return [];
  }

  const genIterableProps = {
    data: new Set(originalData)
  };
  const nonIterableProps = {
    data: {
      length: originalData.length
    }
  };

  for (const propName in props) {
    if (propTypes[propName].type === 'accessor') {
      nonIterableProps[propName] = (_, info) => props[propName](originalData[info.index], info);
    }
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