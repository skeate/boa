// Karma configuration
// Generated on Tue Mar 17 2015 21:35:02 GMT-0400 (EDT)

module.exports = function(config) {
  'use strict';
  var customLaunchers = {
    chromeWin: {
      browserName: 'chrome',
      platform: 'Windows 7'
    },
    chromeLinux: {
      browserName: 'chrome',
      platform: 'Linux'
    },
    chromeOSX: {
      browserName: 'chrome',
      platform: 'OS X 10.9'
    },
    firefoxWin: {
      browserName: 'firefox',
      platform: 'Windows 7'
    },
    firefoxLinux: {
      browserName: 'firefox',
      platform: 'Linux'
    },
    firefoxOSX: {
      browserName: 'firefox',
      platform: 'OS X 10.9'
    },
    ie10: {
      browserName: 'internet explorer',
      version: '10'
    },
    ie11: {
      browserName: 'internet explorer',
      version: '11'
    }
  };
  for (var l in customLaunchers) {
    customLaunchers[l].base = 'SauceLabs';
  }
  var browsers = ['Chrome'];
  var reporters = ['clear-screen', 'mocha', 'coverage'];
  if (process.env.CI === 'true') {
    browsers = Object.keys(customLaunchers);
    reporters = ['dots', 'saucelabs'];
  }
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai'],

    // list of files / patterns to load in the browser
    files: [
      'src/boa.js',
      'tests/**/*.coffee'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': 'coverage',
      '**/*.coffee': ['coffee']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: reporters,

    coverageReporter: {
      reporters: [
        {type: 'text-summary'},
        {type: 'html'}
      ]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: browsers,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    customLaunchers: customLaunchers
  });
};
