var gulp = require('gulp');
var sass = require('gulp-sass');
var jshint = require('gulp-jshint');

gulp.task('lint', function() {
  return gulp.src(['./app.js', 'js/socket.js'])
    .pipe(jshint())
    .pipe(jshint.reporter())
})

gulp.task('sass', function() {
  return gulp.src('scss/custom.scss')
    .pipe(sass())
    .pipe(gulp.dest('css'))
})