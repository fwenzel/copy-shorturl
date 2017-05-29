const path = require('path');

module.exports = {
  entry: './lib/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
