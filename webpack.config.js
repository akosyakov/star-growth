const path = require('path');

module.exports = {
    mode: 'production',
    entry: './lib/browser/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map'
};