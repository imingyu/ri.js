var rollup = require('rollup'),
    path = require('path'),
    json = require('rollup-plugin-json'),
    babel = require('rollup-plugin-babel');
rollup.rollup({
    entry: path.resolve(__dirname, '../src/index.js'),
    plugins: [
        json(),
        babel({
            exclude: 'node_modules/**',
            runtimeHelpers: true,
            externalHelpers:true
        })
    ]
}).then(function (bundle) {
    bundle.write({
        format: "cjs",
        moduleName: "RI",
        dest: "./dist/ri.common.js",
        sourceMap: true
    });

    bundle.write({
        format: "umd",
        moduleName: "RI",
        dest: "./dist/ri.js",
        sourceMap: true
    });
})