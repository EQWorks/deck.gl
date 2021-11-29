"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

var GL_VENDOR = 0x1f00;
var DEFAULT_DECK_PROPS = Object.assign({}, _keplerOutdatedDeck.Deck.defaultProps, {
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
var DEFAULT_TEST_OPTIONS = {
  onTestStart: function onTestStart(testCase) {
    return console.log("# ".concat(testCase.name));
  },
  onTestPass: function onTestPass(testCase) {
    return console.log("ok ".concat(testCase.name, " passed"));
  },
  onTestFail: function onTestFail(testCase) {
    return console.log("not ok ".concat(testCase.name, " failed"));
  },
  timeout: 2000
};
var DEFAULT_TEST_CASE = {
  name: 'Unnamed test',
  props: {},
  onAfterRender: function onAfterRender(_ref) {
    var done = _ref.done;
    return done();
  }
};

var TestRunner = function () {
  function TestRunner() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, TestRunner);
    this.props = Object.assign({}, DEFAULT_DECK_PROPS, props);
    this.isRunning = false;
    this._testCases = [];
    this._testCaseData = null;
    this.isHeadless = Boolean(window.browserTestDriver_isHeadless);
    this.testOptions = Object.assign({}, DEFAULT_TEST_OPTIONS);
  }

  (0, _createClass2.default)(TestRunner, [{
    key: "add",
    value: function add(testCases) {
      if (!Array.isArray(testCases)) {
        testCases = [testCases];
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = testCases[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var testCase = _step.value;

          this._testCases.push(testCase);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return this;
    }
  }, {
    key: "run",
    value: function run() {
      var _this = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      Object.assign(this.testOptions, options);
      return new Promise(function (resolve, reject) {
        _this.deck = new _keplerOutdatedDeck.Deck(Object.assign({}, _this.props, {
          onWebGLInitialized: _this._onWebGLInitialized.bind(_this),
          onLoad: resolve
        }));
        _this.isRunning = true;
        _this._currentTestCase = null;
      }).then(function () {
        var promise = Promise.resolve();

        _this._testCases.forEach(function (testCase) {
          promise = promise.then(function () {
            return _this._runTest(testCase);
          });
        });

        return promise;
      }).catch(function (error) {
        _this._fail({
          error: error.message
        });
      }).finally(function () {
        _this.deck.finalize();

        _this.deck = null;
      });
    }
  }, {
    key: "initTestCase",
    value: function initTestCase(testCase) {
      for (var key in DEFAULT_TEST_CASE) {
        testCase[key] = testCase[key] || DEFAULT_TEST_CASE[key];
      }

      this.testOptions.onTestStart(testCase);
    }
  }, {
    key: "assert",
    value: function assert(testCase) {
      this.onTestPass(testCase);

      this._next();
    }
  }, {
    key: "_pass",
    value: function _pass(result) {
      this.testOptions.onTestPass(this._currentTestCase, result);
    }
  }, {
    key: "_fail",
    value: function _fail(result) {
      this.testOptions.onTestFail(this._currentTestCase, result);
    }
  }, {
    key: "_onWebGLInitialized",
    value: function _onWebGLInitialized(gl) {
      var vendorMasked = gl.getParameter(GL_VENDOR);
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var vendorUnmasked = ext && gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || GL_VENDOR);
      this.gpuVendor = vendorUnmasked || vendorMasked;
    }
  }, {
    key: "_runTest",
    value: function _runTest(testCase) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var deck = _this2.deck;
        _this2._currentTestCase = testCase;
        _this2._next = resolve;

        _this2.initTestCase(testCase);

        var isDone = false;
        var timeoutId = null;

        var done = function done() {
          if (!isDone) {
            isDone = true;
            window.clearTimeout(timeoutId);

            _this2.assert(testCase);
          }
        };

        timeoutId = window.setTimeout(done, testCase.timeout || _this2.testOptions.timeout);
        deck.setProps(Object.assign({}, _this2.props, testCase, {
          onAfterRender: function onAfterRender() {
            testCase.onAfterRender({
              deck: deck,
              layers: deck.layerManager.getLayers(),
              done: done
            });
          }
        }));
      });
    }
  }]);
  return TestRunner;
}();

exports.default = TestRunner;
//# sourceMappingURL=test-runner.js.map