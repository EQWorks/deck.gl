export function flatten(array) {
  let {
    filter = () => true,
    map = x => x,
    result = []
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!Array.isArray(array)) {
    return filter(array) ? [map(array)] : [];
  }

  return flattenArray(array, filter, map, result);
}

function flattenArray(array, filter, map, result) {
  let index = -1;

  while (++index < array.length) {
    const value = array[index];

    if (Array.isArray(value)) {
      flattenArray(value, filter, map, result);
    } else if (filter(value)) {
      result.push(map(value));
    }
  }

  return result;
}

export function countVertices(nestedArray) {
  let count = 0;
  let index = -1;

  while (++index < nestedArray.length) {
    const value = nestedArray[index];

    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      count += countVertices(value);
    } else {
      count++;
    }
  }

  return count;
}
export function flattenVertices(nestedArray) {
  let {
    result = [],
    dimensions = 3
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let index = -1;
  let vertexLength = 0;

  while (++index < nestedArray.length) {
    const value = nestedArray[index];

    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      flattenVertices(value, {
        result,
        dimensions
      });
    } else {
      if (vertexLength < dimensions) {
        result.push(value);
        vertexLength++;
      }
    }
  }

  if (vertexLength > 0 && vertexLength < dimensions) {
    result.push(0);
  }

  return result;
}
export function fillArray(_ref) {
  let {
    target,
    source,
    start = 0,
    count = 1
  } = _ref;
  const length = source.length;
  const total = count * length;
  let copied = 0;

  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return target;
}
//# sourceMappingURL=flatten.js.map