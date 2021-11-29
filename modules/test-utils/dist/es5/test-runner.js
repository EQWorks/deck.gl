"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

const GL_VENDOR = 0x1f00;
const DEFAULT_DECK_PROPS = Object.assign({}, _keplerOutdatedDeck.Deck.defaultProps, {
  id: 'deckgl-render-test',
  width: 800,
  height: 450,
  style: {
    position: 'absolute',
    left: '0px',
    top: '0px'
  },
  views: [new _keplerOutdatedDeck.MapView()],
  useDevicePixels: false,
  debug: true
});
const DEFAULT_TEST_OPTIONS = {
  onTestStart: testCase => console.log("# ".concat(testCase.name)),
  onTestPass: testCase => console.log("ok ".concat(testCase.name, " passed")),
  onTestFail: testCase => console.log("not ok ".concat(testCase.name, " failed")),
  timeout: 2000
};
const DEFAULT_TEST_CASE = {
  name: 'Unnamed test',
  props: {},
  onAfterRender: _ref => {
    let {
      done
    } = _ref;
    return done();
  }
};

class TestRunner {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.props = Object.assign({}, DEFAULT_DECK_PROPS, props);
    this.isRunning = false;
    this._testCases = [];
    this._testCaseData = null;
    this.isHeadless = Boolean(window.browserTestDriver_isHeadless);
    this.testOptions = Object.assign({}, DEFAULT_TEST_OPTIONS);
  }

  add(testCases) {
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }

    for (const testCase of testCases) {
      this._testCases.push(testCase);
    }

    return this;
  }

  run() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    Object.assign(this.testOptions, options);
    return new Promise((resolve, reject) => {
      this.deck = new _keplerOutdatedDeck.Deck(Object.assign({}, this.props, {
        onWebGLInitialized: this._onWebGLInitialized.bind(this),
        onLoad: resolve
      }));
      this.isRunning = true;
      this._currentTestCase = null;
    }).then(() => {
      let promise = Promise.resolve();

      this._testCases.forEach(testCase => {
        promise = promise.then(() => this._runTest(testCase));
      });

      return promise;
    }).catch(error => {
      this._fail({
        error: error.message
      });
    }).finally(() => {
      this.deck.finalize();
      this.deck = null;
    });
  }

  initTestCase(testCase) {
    for (const key in DEFAULT_TEST_CASE) {
      testCase[key] = testCase[key] || DEFAULT_TEST_CASE[key];
    }

    this.testOptions.onTestStart(testCase);
  }

  assert(testCase) {
    this.onTestPass(testCase);

    this._next();
  }

  _pass(result) {
    this.testOptions.onTestPass(this._currentTestCase, result);
  }

  _fail(result) {
    this.testOptions.onTestFail(this._currentTestCase, result);
  }

  _onWebGLInitialized(gl) {
    const vendorMasked = gl.getParameter(GL_VENDOR);
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const vendorUnmasked = ext && gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || GL_VENDOR);
    this.gpuVendor = vendorUnmasked || vendorMasked;
  }

  _runTest(testCase) {
    return new Promise((resolve, reject) => {
      const {
        deck
      } = this;
      this._currentTestCase = testCase;
      this._next = resolve;
      this.initTestCase(testCase);
      let isDone = false;
      let timeoutId = null;

      const done = () => {
        if (!isDone) {
          isDone = true;
          window.clearTimeout(timeoutId);
          this.assert(testCase);
        }
      };

      timeoutId = window.setTimeout(done, testCase.timeout || this.testOptions.timeout);
      deck.setProps(Object.assign({}, this.props, testCase, {
        onAfterRender: () => {
          testCase.onAfterRender({
            deck,
            layers: deck.layerManager.getLayers(),
            done
          });
        }
      }));
    });
  }

}

exports.default = TestRunner;
//# sourceMappingURL=test-runner.js.map