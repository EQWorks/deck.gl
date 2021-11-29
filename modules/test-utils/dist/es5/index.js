"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "toLowPrecision", {
  enumerable: true,
  get: function get() {
    return _precision.toLowPrecision;
  }
});
Object.defineProperty(exports, "gl", {
  enumerable: true,
  get: function get() {
    return _setupGl.default;
  }
});
Object.defineProperty(exports, "testLayer", {
  enumerable: true,
  get: function get() {
    return _lifecycleTest.testLayer;
  }
});
Object.defineProperty(exports, "testInitializeLayer", {
  enumerable: true,
  get: function get() {
    return _lifecycleTest.testInitializeLayer;
  }
});
Object.defineProperty(exports, "testUpdateLayer", {
  enumerable: true,
  get: function get() {
    return _lifecycleTest.testUpdateLayer;
  }
});
Object.defineProperty(exports, "testDrawLayer", {
  enumerable: true,
  get: function get() {
    return _lifecycleTest.testDrawLayer;
  }
});
Object.defineProperty(exports, "generateLayerTests", {
  enumerable: true,
  get: function get() {
    return _generateLayerTests.generateLayerTests;
  }
});
Object.defineProperty(exports, "TestRunner", {
  enumerable: true,
  get: function get() {
    return _testRunner.default;
  }
});
Object.defineProperty(exports, "SnapshotTestRunner", {
  enumerable: true,
  get: function get() {
    return _snapshotTestRunner.default;
  }
});

var _precision = require("./utils/precision");

var _setupGl = _interopRequireDefault(require("./utils/setup-gl"));

var _lifecycleTest = require("./lifecycle-test");

var _generateLayerTests = require("./generate-layer-tests");

var _testRunner = _interopRequireDefault(require("./test-runner"));

var _snapshotTestRunner = _interopRequireDefault(require("./snapshot-test-runner"));
//# sourceMappingURL=index.js.map