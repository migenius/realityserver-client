const rollup = require('rollup')
const fs = require('fs-extra')
const path = require('path')

// make sure we're in the right folder
process.chdir(path.resolve(__dirname, '..'))

fs.removeSync('lib');
fs.mkdirSync('lib');

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
]


function generate_bundled_module(input_file, output_file, format, plugins = []) {
    console.log(`Generating ${output_file} bundle.`)

    return rollup
        .rollup({
            input: input_file,
            plugins: [...pre_rollup_plugins, ...plugins, ...post_rollup_plugins]
        })
        .then(bundle =>
            bundle.write({
                file: output_file,
                format:format.format,
                name: format.name,
                banner: '/******************************************************************************\n' +
                        '* Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.\n' +
                        '******************************************************************************/'
            })
        )
}

function build() {
    return Promise.all([
        generate_bundled_module(
            path.resolve('src', 'index.js'),
            path.resolve('lib', 'realityserver.js'),
            {format:'iife',name:'RS'}
        ),

        generate_bundled_module(
            path.resolve('src', 'index.js'),
            path.resolve('lib', 'realityserver.min.js'),
            {format:'iife',name:'RS'},
            production_rollup_plugins
        )
    ])
}

build().catch(e => {
    console.error(e)
    if (e.frame) {
        console.error(e.frame)
    }
    process.exit(1)
})