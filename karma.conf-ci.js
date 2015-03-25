module.exports = function(config) {
  'use strict';
  var customLaunchers = {
    chromeOSX: {
      browserName: 'chrome'
    },
    firefox: {
      browserName: 'firefox'
    },
    ie11: {
      browserName: 'internet explorer',
      version: '11'
    }
  };
  for (var l in customLaunchers) {
    customLaunchers[l].base = 'SauceLabs';
  }
  var browsers = Object.keys(customLaunchers);
  var reporters = ['mocha', 'saucelabs', 'coverage'];
  config.set({
    basePath: '',
    frameworks: ['mocha', 'sinon-chai'],
    files: [
      'src/boa.js',
      'tests/**/*.coffee'
    ],
    preprocessors: {
      'src/**/*.js': 'coverage',
      '**/*.coffee': ['coffee']
    },
    coverageReporter: {
      reporters: [
        {type: 'text-summary'},
        {type: 'html'},
        {type: 'lcov'}
      ]
    },
    reporters: reporters,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: browsers,
    singleRun: true,
    customLaunchers: customLaunchers
  });
};
