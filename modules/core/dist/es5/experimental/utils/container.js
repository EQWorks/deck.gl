"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.count = count;
exports.entries = entries;
exports.forEach = forEach;
exports.isContainer = isContainer;
exports.isKeyedContainer = isKeyedContainer;
exports.isObject = isObject;
exports.isPlainObject = isPlainObject;
exports.keys = keys;
exports.map = map;
exports.reduce = reduce;
exports.toJS = toJS;
exports.values = values;
const ERR_NOT_CONTAINER = 'Expected a container';
const ERR_NOT_KEYED_CONTAINER = 'Expected a "keyed" container';

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object;
}

function isContainer(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value) || isObject(value);
}

function count(container) {
  if (typeof container.count === 'function') {
    return container.count();
  }

  if (Number.isFinite(container.size)) {
    return container.size;
  }

  if (Number.isFinite(container.length)) {
    return container.length;
  }

  if (isPlainObject(container)) {
    return Object.keys(container).length;
  }

  throw new Error(ERR_NOT_CONTAINER);
}

function values(container) {
  if (Array.isArray(container)) {
    return container;
  }

  const prototype = Object.getPrototypeOf(container);

  if (typeof prototype.values === 'function') {
    return container.values();
  }

  if (typeof container.constructor.values === 'function') {
    return container.constructor.values(container);
  }

  const iterator = container[Symbol.iterator];

  if (iterator) {
    return container;
  }

  throw new Error(ERR_NOT_CONTAINER);
}

function isKeyedContainer(container) {
  if (Array.isArray(container)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(container);

  if (typeof prototype.shift === 'function') {
    return false;
  }

  const hasKeyedMethods = typeof prototype.get === 'function';
  return hasKeyedMethods || isPlainObject(container);
}

function keys(keyedContainer) {
  const prototype = Object.getPrototypeOf(keyedContainer);

  if (typeof prototype.keys === 'function') {
    return keyedContainer.keys();
  }

  if (typeof keyedContainer.constructor.keys === 'function') {
    return keyedContainer.constructor.keys(keyedContainer);
  }

  throw new Error(ERR_NOT_KEYED_CONTAINER);
}

function entries(keyedContainer) {
  const prototype = Object.getPrototypeOf(keyedContainer);

  if (typeof prototype.entries === 'function') {
    return keyedContainer.entries();
  }

  if (typeof keyedContainer.constructor.entries === 'function') {
    return keyedContainer.constructor.entries(keyedContainer);
  }

  return null;
}

function forEach(container, visitor) {
  const prototype = Object.getPrototypeOf(container);

  if (prototype.forEach) {
    container.forEach(visitor);
    return;
  }

  const isKeyed = isKeyedContainer(container);

  if (isKeyed) {
    for (const [key, value] of entries(container)) {
      visitor(value, key, container);
    }

    return;
  }

  let index = 0;

  for (const element of values(container)) {
    visitor(element, index, container);
    index++;
  }
}

function map(container, visitor) {
  const prototype = Object.getPrototypeOf(container);

  if (prototype.forEach) {
    const result = [];
    container.forEach((x, i, e) => result.push(visitor(x, i, e)));
    return result;
  }

  const isKeyed = isKeyedContainer(container);
  const result = [];

  if (isKeyed) {
    for (const [key, value] of entries(container)) {
      result.push(visitor(value, key, container));
    }
  } else {
    let index = 0;

    for (const element of values(container)) {
      result.push(visitor(element, index, container));
      index++;
    }
  }

  return result;
}

function reduce(container, visitor) {
  const prototype = Object.getPrototypeOf(container);

  if (prototype.forEach) {
    const result = [];
    container.forEach((x, i, e) => result.push(visitor(x, i, e)));
    return result;
  }

  const isKeyed = isKeyedContainer(container);
  const result = [];

  if (isKeyed) {
    for (const [key, value] of entries(container)) {
      result.push(visitor(value, key, container));
    }
  } else {
    let index = 0;

    for (const element of values(container)) {
      result.push(visitor(element, index, container));
      index++;
    }
  }

  return result;
}

function toJS(container) {
  if (!isObject(container)) {
    return container;
  }

  if (isKeyedContainer(container)) {
    const result = {};

    for (const [key, value] of entries(container)) {
      result[key] = toJS(value);
    }

    return result;
  }

  const result = [];

  for (const value of values(container)) {
    result.push(toJS(value));
  }

  return result;
}
//# sourceMappingURL=container.js.map