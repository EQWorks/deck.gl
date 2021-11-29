import TestRunner from './test-runner';
import { getBoundingBoxInPage } from './utils/dom';
export default class SnapshotTestRunner extends TestRunner {
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
      region: getBoundingBoxInPage(this.deck.canvas)
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
//# sourceMappingURL=snapshot-test-runner.js.map