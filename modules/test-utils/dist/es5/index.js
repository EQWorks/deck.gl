"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "SnapshotTestRunner", {
  enumerable: true,
  get: function () {
    return _snapshotTestRunner.default;
  }
});
Object.defineProperty(exports, "TestRunner", {
  enumerable: true,
  get: function () {
    return _testRunner.default;
  }
});
Object.defineProperty(exports, "generateLayerTests", {
  enumerable: true,
  get: function () {
    return _generateLayerTests.generateLayerTests;
  }
});
Object.defineProperty(exports, "gl", {
  enumerable: true,
  get: function () {
    return _setupGl.default;
  }
});
Object.defineProperty(exports, "testDrawLayer", {
  enumerable: true,
  get: function () {
    return _lifecycleTest.testDrawLayer;
  }
});
Object.defineProperty(exports, "testInitializeLayer", {
  enumerable: true,
  get: function () {
    return _lifecycleTest.testInitializeLayer;
  }
});
Object.defineProperty(exports, "testLayer", {
  enumerable: true,
  get: function () {
    return _lifecycleTest.testLayer;
  }
});
Object.defineProperty(exports, "testUpdateLayer", {
  enumerable: true,
  get: function () {
    return _lifecycleTest.testUpdateLayer;
  }
});
Object.defineProperty(exports, "toLowPrecision", {
  enumerable: true,
  get: function () {
    return _precision.toLowPrecision;
  }
});

var _precision = require("./utils/precision");

var _setupGl = _interopRequireDefault(require("./utils/setup-gl"));

var _lifecycleTest = require("./lifecycle-test");

var _generateLayerTests = require("./generate-layer-tests");

var _testRunner = _interopRequireDefault(require("./test-runner"));

var _snapshotTestRunner = _interopRequireDefault(require("./snapshot-test-runner"));
//# sourceMappingURL=index.js.map