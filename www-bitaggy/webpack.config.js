const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
  },
  devServer: {
    port: 8080,
    // hot: true
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [
      'index.html',
      { from: 'imgs/', to: 'imgs/' }
    ]}),
    new NodePolyfillPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: () => [
                  require('autoprefixer')
                ]
              }
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ],
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    layers: true,
    lazyCompilation: true,
    outputModule: true,
    topLevelAwait: true
  }
};
