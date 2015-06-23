var gulp = require('gulp'),
    rename = require("gulp-rename"),
    templateCache = require('gulp-angular-templatecache'),
    useref = require('gulp-useref'),
    gulpif = require("gulp-if"),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    rev = require("gulp-rev"),
    debug = require("gulp-debug"),
    revReplace = require("gulp-rev-replace"),
    del =  require("del")


gulp.task('template', function(){
    gulp.src('static/src/html/*.html')
        .pipe(templateCache({
            root: "/static/src/html/",
            module: "times"
        }))
        .pipe(debug())
        .pipe(gulp.dest("static/"))
})

gulp.task('compile_admin', function(){
    var asset = useref.assets({
        searchPath: "."
    })
    gulp.src('templates/admin.html')
        .pipe(asset)
        .pipe(gulpif("*.css", minifyCss()))
        .pipe(rev())
        .pipe(asset.restore())
        .pipe(useref())
        .pipe(revReplace())
        .pipe(debug({title: "output"}))
        .pipe(gulp.dest("templates"))
})

gulp.task("clean", function(cb){
    del(["static/dist/"], cb)
})

gulp.task('reorder', function(){
    gulp.src("static/static/dist/*")
        .pipe(gulp.dest('static/dist/'))
})

gulp.task('default', ['clean', 'template', "compile_admin", 'reorder'])

