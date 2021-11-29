"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _testRunner = _interopRequireDefault(require("./test-runner"));

var _dom = require("./utils/dom");

class SnapshotTestRunner extends _testRunner.default {
  constructor(props) {
    super(props);
    this.isDiffing = false;
    Object.assign(this.testOptions, {
      imageDiffOptions: {}
    });
  }

  initTestCase(testCase) {
    super.initTestCase(testCase);

    if (!testCase.goldenImage) {
      throw new Error("Test case ".concat(testCase.name, " does not have golden image"));
    }
  }

  shouldRender() {
    return !this.isDiffing;
  }

  assert(testCase) {
    if (this.isDiffing) {
      return;
    }

    this.isDiffing = true;
    const diffOptions = Object.assign({}, this.testOptions.imageDiffOptions, testCase.imageDiffOptions, {
      goldenImage: testCase.goldenImage,
      region: (0, _dom.getBoundingBoxInPage)(this.deck.canvas)
    });
    window.browserTestDriver_captureAndDiffScreen(diffOptions).then(result => {
      if (result.success) {
        this._pass(result);
      } else {
        this._fail(result);
      }

      this.isDiffing = false;

      this._next();
    });
  }

}

exports.default = SnapshotTestRunner;
//# sourceMappingURL=snapshot-test-runner.js.map