var gulp = require('gulp');
var jshint = require('gulp-jshint');

gulp.task('lint', function() {
  return gulp.src(['./app.js', 'js/socket.js'])
    .pipe(jshint())
    .pipe(jshint.reporter())
})
