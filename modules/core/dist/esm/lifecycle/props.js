import assert from '../utils/assert';
export function validateProps(props) {
  const propTypes = getPropTypes(props);

  for (const propName in propTypes) {
    const propType = propTypes[propName];
    const {
      validate
    } = propType;

    if (validate && !validate(props[propName], propType)) {
      throw new Error("Invalid prop ".concat(propName, ": ").concat(props[propName]));
    }
  }
}
export function diffProps(props, oldProps) {
  const propsChangedReason = compareProps({
    newProps: props,
    oldProps,
    propTypes: getPropTypes(props),
    ignoreProps: {
      data: null,
      updateTriggers: null
    }
  });
  const dataChangedReason = diffDataProps(props, oldProps);
  let updateTriggersChangedReason = false;

  if (!dataChangedReason) {
    updateTriggersChangedReason = diffUpdateTriggers(props, oldProps);
  }

  return {
    dataChanged: dataChangedReason,
    propsChanged: propsChangedReason,
    updateTriggersChanged: updateTriggersChangedReason
  };
}
export function compareProps() {
  let {
    newProps,
    oldProps,
    ignoreProps = {},
    propTypes = {},
    triggerName = 'props'
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  assert(oldProps !== undefined && newProps !== undefined, 'compareProps args');

  if (oldProps === newProps) {
    return null;
  }

  if (typeof newProps !== 'object' || newProps === null) {
    return "".concat(triggerName, " changed shallowly");
  }

  if (typeof oldProps !== 'object' || oldProps === null) {
    return "".concat(triggerName, " changed shallowly");
  }

  for (const key in oldProps) {
    if (!(key in ignoreProps)) {
      if (!(key in newProps)) {
        return "".concat(triggerName, ".").concat(key, " dropped");
      }

      const newProp = newProps[key];
      const oldProp = oldProps[key];
      const propType = propTypes[key];
      let equal = propType && propType.equal;

      if (equal && !equal(newProp, oldProp, propType)) {
        return "".concat(triggerName, ".").concat(key, " changed deeply");
      }

      if (!equal) {
        equal = newProp && oldProp && newProp.equals;

        if (equal && !equal.call(newProp, oldProp)) {
          return "".concat(triggerName, ".").concat(key, " changed deeply");
        }
      }

      if (!equal && oldProp !== newProp) {
        return "".concat(triggerName, ".").concat(key, " changed shallowly");
      }
    }
  }

  for (const key in newProps) {
    if (!(key in ignoreProps)) {
      if (!(key in oldProps)) {
        return "".concat(triggerName, ".").concat(key, " added: undefined -> ").concat(newProps[key]);
      }
    }
  }

  return null;
}

function diffDataProps(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  const {
    dataComparator
  } = props;

  if (dataComparator) {
    if (!dataComparator(props.data, oldProps.data)) {
      return 'Data comparator detected a change';
    }
  } else if (props.data !== oldProps.data) {
    return 'A new data container was supplied';
  }

  return null;
}

function diffUpdateTriggers(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  if ('all' in props.updateTriggers) {
    const diffReason = diffUpdateTrigger(props, oldProps, 'all');

    if (diffReason) {
      return {
        all: true
      };
    }
  }

  const triggerChanged = {};
  let reason = false;

  for (const triggerName in props.updateTriggers) {
    if (triggerName !== 'all') {
      const diffReason = diffUpdateTrigger(props, oldProps, triggerName);

      if (diffReason) {
        triggerChanged[triggerName] = true;
        reason = triggerChanged;
      }
    }
  }

  return reason;
}

function diffUpdateTrigger(props, oldProps, triggerName) {
  let newTriggers = props.updateTriggers[triggerName];
  newTriggers = newTriggers === undefined || newTriggers === null ? {} : newTriggers;
  let oldTriggers = oldProps.updateTriggers[triggerName];
  oldTriggers = oldTriggers === undefined || oldTriggers === null ? {} : oldTriggers;
  const diffReason = compareProps({
    oldProps: oldTriggers,
    newProps: newTriggers,
    triggerName
  });
  return diffReason;
}

function getPropTypes(props) {
  const layer = props._component;
  const LayerType = layer && layer.constructor;
  return LayerType ? LayerType._propTypes : {};
}
//# sourceMappingURL=props.js.map