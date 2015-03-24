'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');
var umd = require('gulp-umd');
var reload = browserSync.reload;
var karma = require('karma').server;
var coveralls = require('gulp-coveralls');

gulp.task('dev', function() {
  gulp.watch(['src/boa.js'], ['build']);
});

gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, function() {
    done();
  });
  if (process.env.CI === 'true') {
    gulp.src('./coverage/**/lcov.info')
      .pipe(coveralls());
  }
});

gulp.task('test-watch', function() {
  karma.start({
    configFile: __dirname + '/karma.conf.js'
  });
});

gulp.task('build', function() {
  gulp.src(['src/boa.js'])
    .pipe(umd())
    .pipe(gulp.dest('dist/'))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('demo', function() {
  browserSync({
    server: {
      baseDir: ['demo', 'dist']
    }
  });
  gulp.watch(['dist/**/*.js', 'demo/**/*.{html,js,css}'], reload);
  gulp.watch('src/**/*.js', ['build']);
});
