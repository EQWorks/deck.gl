"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _testRunner = _interopRequireDefault(require("./test-runner"));

var _dom = require("./utils/dom");

var SnapshotTestRunner = function (_TestRunner) {
  (0, _inherits2.default)(SnapshotTestRunner, _TestRunner);

  function SnapshotTestRunner(props) {
    var _this;

    (0, _classCallCheck2.default)(this, SnapshotTestRunner);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(SnapshotTestRunner).call(this, props));
    _this.isDiffing = false;
    Object.assign(_this.testOptions, {
      imageDiffOptions: {}
    });
    return _this;
  }

  (0, _createClass2.default)(SnapshotTestRunner, [{
    key: "initTestCase",
    value: function initTestCase(testCase) {
      (0, _get2.default)((0, _getPrototypeOf2.default)(SnapshotTestRunner.prototype), "initTestCase", this).call(this, testCase);

      if (!testCase.goldenImage) {
        throw new Error("Test case ".concat(testCase.name, " does not have golden image"));
      }
    }
  }, {
    key: "shouldRender",
    value: function shouldRender() {
      return !this.isDiffing;
    }
  }, {
    key: "assert",
    value: function assert(testCase) {
      var _this2 = this;

      if (this.isDiffing) {
        return;
      }

      this.isDiffing = true;
      var diffOptions = Object.assign({}, this.testOptions.imageDiffOptions, testCase.imageDiffOptions, {
        goldenImage: testCase.goldenImage,
        region: (0, _dom.getBoundingBoxInPage)(this.deck.canvas)
      });
      window.browserTestDriver_captureAndDiffScreen(diffOptions).then(function (result) {
        if (result.success) {
          _this2._pass(result);
        } else {
          _this2._fail(result);
        }

        _this2.isDiffing = false;

        _this2._next();
      });
    }
  }]);
  return SnapshotTestRunner;
}(_testRunner.default);

exports.default = SnapshotTestRunner;
//# sourceMappingURL=snapshot-test-runner.js.map