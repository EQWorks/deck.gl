import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import TestRunner from './test-runner';
import { getBoundingBoxInPage } from './utils/dom';

var SnapshotTestRunner = function (_TestRunner) {
  _inherits(SnapshotTestRunner, _TestRunner);

  function SnapshotTestRunner(props) {
    var _this;

    _classCallCheck(this, SnapshotTestRunner);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SnapshotTestRunner).call(this, props));
    _this.isDiffing = false;
    Object.assign(_this.testOptions, {
      imageDiffOptions: {}
    });
    return _this;
  }

  _createClass(SnapshotTestRunner, [{
    key: "initTestCase",
    value: function initTestCase(testCase) {
      _get(_getPrototypeOf(SnapshotTestRunner.prototype), "initTestCase", this).call(this, testCase);

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
        region: getBoundingBoxInPage(this.deck.canvas)
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
}(TestRunner);

export { SnapshotTestRunner as default };
//# sourceMappingURL=snapshot-test-runner.js.map