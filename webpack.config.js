/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  entry: './app.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'Models': path.resolve(__dirname, 'src/models'),
      'Sites': path.resolve(__dirname, 'src/sites'),
      'Utils': path.resolve(__dirname, 'src/utils'),
      'Types': path.resolve(__dirname, 'src/types'),
    },
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    'puppeteer': 'require("puppeteer")',
    'pg-hstore': 'require("pg-hstore")',
    'sqlite3': 'require("sqlite3")',
    'tedious': 'require("tedious")',
    'pg': 'require("pg")',
  },
  target: 'node',
};
