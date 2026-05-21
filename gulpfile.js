// "use strict";
const data = require("./src/views/data/data.json");
const path = require("path");

/** Declare module */
const { src, dest, parallel, watch, series } = require("gulp"),
    concat = require("gulp-concat"),
    sass = require("gulp-sass")(require("sass")),
    pug = require("gulp-pug"),
    autoprefixer = require("gulp-autoprefixer"),
    sourcemaps = require("gulp-sourcemaps"),
    browserSync = require("browser-sync").create();

/** Files Path */
const FilesPath = {
    sassFiles: "src/assets/scss/**/*.scss",
    jsFiles: "src/assets/js/*.js",
    htmlFiles: "src/views/pages/**/*.pug"
};

const { sassFiles, jsFiles, htmlFiles } = FilesPath;
const pagesBase = "src/views/pages";

function getPageTemplatePath(filePath) {
    if (typeof filePath !== "string") {
        return null;
    }

    const normalizedPath = path.isAbsolute(filePath)
        ? path.relative(process.cwd(), filePath)
        : filePath;
    const relativePath = normalizedPath.replace(/\\/g, "/");

    return relativePath.startsWith(`${pagesBase}/`) ? relativePath : null;
}

/** Sass Task */
function sassTask() {
    return src(sassFiles, { sourcemaps: true })
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer())
        // .pipe(concat("style.css"))
        .pipe(sourcemaps.write())
        .pipe(dest("./dist/assets/css"))
        .pipe(browserSync.stream());
}

/** JS Task */
function jsTask() {
    return src(jsFiles).pipe(concat("all.js")).pipe(dest("dist/assets/js"));
}

/** PUG Task */
function pugTask(filePath) {
    const pageTemplatePath = getPageTemplatePath(filePath);
    const sourceFiles = pageTemplatePath
        ? pageTemplatePath
        : htmlFiles;

    return src(sourceFiles, { base: pagesBase })
        // .pipe(cache("pug"))
        .pipe(pug({
            pretty: true, doctype: "HTML",
            locals: {
                nbcData: data
            }
        }))
        .pipe(dest("dist"))
        .pipe(browserSync.stream());
}

/** Assets Task */
function assetsTask() {
    return src("src/assets/**").pipe(dest("dist/assets"));
}

/** Browsersync Tasks */
function browsersyncServe(cb) {
    browserSync.init({
        server: {
            baseDir: "dist"
        }
    });
    cb();
}

/** Watch Task */
function watchTask() {
    watch("src/assets/scss/**/*.scss", series(assetsTask, sassTask));
    watch([
        "src/assets/imgs/*.+(png|jpeg|jpg|gif|svg)",
        "src/assets/imgs/*/*.+(png|jpeg|jpg|gif|svg)",
        "src/assets/fonts/**/*.+(eot|woff|woff2)"
    ], assetsTask);
    watch("src/assets/js/**/*.js", series(assetsTask, jsTask));

    const pugWatcher = watch("src/views/**/*.pug");
    pugWatcher.on("add", pugTask);
    pugWatcher.on("change", pugTask);
}

exports.default = series(assetsTask, parallel(pugTask, sassTask, jsTask));
exports.serve = series(browsersyncServe, watchTask, assetsTask, parallel(pugTask, sassTask, jsTask));
exports.sass = sassTask;
