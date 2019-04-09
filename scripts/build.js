const rollup = require('rollup');
const fs = require('fs-extra');
const path = require('path');

// make sure we're in the right folder
process.chdir(path.resolve(__dirname, '..'));

fs.removeSync('./lib');

const pre_rollup_plugins = [
    require('rollup-plugin-node-resolve')(),
    require('rollup-plugin-commonjs')(),
    require('rollup-plugin-cleanup')()
];

const production_rollup_plugins = [
    require('rollup-plugin-terser').terser({
        output: {
            comments: 'all'
        }
    })
];

const post_rollup_plugins = [
    require('rollup-plugin-filesize')()
];


function generate_bundled_module(input_file, root_path, basename, formats, plugins = []) {
    console.log(`Generating ${basename} bundle.`);

    return rollup
        .rollup({
            input: input_file,
            plugins: [ ...pre_rollup_plugins, ...plugins, ...post_rollup_plugins ]
        })
        .then(bundle => {
            return Promise.all(
                formats.map(format => {
                    return bundle.write({
                        file: path.join(root_path, format.format, basename),
                        format: format.format,
                        name: format.name,
                        sourcemap: true,
                        banner: '/******************************************************************************\n' +
                                '* Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.\n' +
                                '******************************************************************************/'
                    });
                })
            );
        });
}

function build() {
    return Promise.all([
        generate_bundled_module(
            path.resolve('src', 'index.js'),
            path.resolve('lib'),
            'realityserver.js',
            [
                { format: 'esm', name: 'RS' },
                { format: 'umd', name: 'RS' }
            ]
        ),
        generate_bundled_module(
            path.resolve('src', 'index.js'),
            path.resolve('lib'),
            'realityserver.min.js',
            [
                { format: 'esm', name: 'RS' },
                { format: 'umd', name: 'RS' }
            ],
            production_rollup_plugins
        )
    ]);
}

build()
    .then(() => {
        return fs.copy(
            path.resolve('lib', 'umd', 'realityserver.js'),
            path.resolve('static', 'docs', 'lib', 'realityserver.js'));
    })
    .catch(e => {
        console.error(e);
        if (e.frame) {
            console.error(e.frame);
        }
        process.exit(1);
    });
