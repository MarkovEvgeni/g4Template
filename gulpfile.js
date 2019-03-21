var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var browserSync = require('browser-sync').create();;
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var rigger = require('gulp-rigger');
var uglify = require('gulp-uglify');
var del = require('del');
var reload = browserSync.reload;

var path = {
    build: {
        html: 'build',
        js: 'build/js',
        ts: 'src/js/ts',
        css: 'build/css/',
        img: 'build/assets/img',
        video: 'build/assets/video',
        fonts: 'build/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        ts: 'src/ts/tscript.ts',
        css: 'src/css/style.scss',
        img: 'src/assets/img/**/*.*',
        video: 'src/assets/video/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        ts: 'src/ts/**/*.ts',
        css: 'src/css/**/*.scss',
        img: 'src/assets/img/**/*.*',
        video: 'src/assets/video/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: {
        build: 'build/**',
        ts: 'src/js/ts/**'
    }

};

function webserver(cb) {
    browserSync.init({
        server: {
            baseDir: "./build"
        },
        logPrefix: "My Gulp Local Server"
    });
    cb();
}

function browserSyncReload(done) {
    browsersync.reload();
    done();
}

function htmlBuild() {
    return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({
            stream: true
        }));
};
function jsBuild() {
    return gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({
            stream: true
        }));
};
function cssBuild() {
    return gulp.src(path.src.css)
        .pipe(rigger())
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions', '> 1%']
        }))
        .pipe(cssnano())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({
            stream: true
        }));
};
function imgBuild() {
    return gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
};
function fontsBuild() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
        .pipe(reload({stream: true}));
};

function watch() {
    gulp.watch(path.watch.html, gulp.series(htmlBuild, browserSyncReload));
    gulp.watch(path.watch.css, gulp.series(cssBuild, browserSyncReload));
    gulp.watch(path.watch.js, gulp.series(jsBuild, browserSyncReload));
    gulp.watch(path.watch.img, gulp.series(imgBuild, browserSyncReload));
    gulp.watch(path.watch.fonts, gulp.series(fontsBuild, browserSyncReload));
};

function clean(cb) {
    del([path.clean.build, path.clean.ts]);
    cb();
};


exports.clean = clean;
exports.watch = watch;
exports.html = htmlBuild;
exports.js = jsBuild;
exports.css = cssBuild;
exports.img = imgBuild;
exports.fonts = fontsBuild;

var build = gulp.series(clean, htmlBuild, jsBuild, cssBuild, imgBuild, fontsBuild);
gulp.task('build', build);

gulp.task('default', gulp.series(build, webserver, watch));
