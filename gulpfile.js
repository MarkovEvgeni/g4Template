var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var browserSync = require('browser-sync').create();;
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var rigger = require('gulp-rigger');
var terser = require('gulp-terser');
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
        fonts: 'build/fonts/',
        dataAssets: 'build/data/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        ts: 'src/ts/tscript.ts',
        css: 'src/css/style.scss',
        img: 'src/assets/img/**/*.*',
        video: 'src/assets/video/**/*.*',
        fonts: 'src/fonts/**/*.*',
        dataAssets: 'src/data/*.*'
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

// function browserSyncReload(done) {
//     browserSync.reload();
//     done();
// }

function dataSourceBuild() {
    return gulp.src(path.src.dataAssets)
        .pipe(gulp.dest(path.build.dataAssets))
        .pipe(reload({
            stream: true
        }));
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
        .pipe(terser())
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
    gulp.watch(path.watch.html, dataSourceBuild, browserSync.reload);
    gulp.watch(path.watch.html, htmlBuild, browserSync.reload);
    gulp.watch(path.watch.css, cssBuild, browserSync.reload);
    gulp.watch(path.watch.js, jsBuild, browserSync.reload);
    gulp.watch(path.watch.img, imgBuild, browserSync.reload);
    gulp.watch(path.watch.fonts, fontsBuild, browserSync.reload);
};

function clean() {
    return del([
        path.clean.build,
        path.clean.ts
    ]);
};


exports.clean = clean;
exports.dataSource = dataSourceBuild;
exports.watch = watch;
exports.html = htmlBuild;
exports.js = jsBuild;
exports.css = cssBuild;
exports.img = imgBuild;
exports.fonts = fontsBuild;

var build = gulp.series(clean, dataSourceBuild, htmlBuild, jsBuild, cssBuild, imgBuild, fontsBuild);
gulp.task('build', build);

gulp.task('default', gulp.series(build, webserver, watch));
