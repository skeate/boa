module.exports = function(config) {
  'use strict';
  var browsers = ['Chrome', 'Firefox'];
  var reporters = ['clear-screen', 'mocha', 'coverage'];
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

    reporters: reporters,

    coverageReporter: {
      reporters: [
        {type: 'text-summary'},
        {type: 'html'},
        {type: 'lcov'}
      ]
    },

    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    browsers: browsers,

    singleRun: false
  });
};
