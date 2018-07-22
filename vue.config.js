const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.(glsl|frag|vert)$/,
          use: 'raw-loader',
          exclude: /node_modules/
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: 'glslify-loader',
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunks: ['app'],
        template: path.resolve('public/index.html')
      }),
      new HtmlWebpackPlugin({
        chunks: ['visual'],
        filename: 'visual.html',
        template: path.resolve('public/visual.html')
      }),
      new CopyWebpackPlugin(
        [
          {
            from: path.resolve('src/control/assets'),
            to: path.resolve('dist/assets'),
            ignore: [
              '.*'
            ]
          },
          {
            from: path.resolve('src/control/_assets'),
            to: path.resolve('dist/_assets'),
            ignore: [
              '.*'
            ]
          },
          {
            from: path.resolve('src/visual/assets'),
            to: path.resolve('dist/src/visual/assets'),
            ignore: [
              '.*'
            ]
          }
        ]
      )
    ],
    entry: {
      visual: './src/visual/main.js'
    }
  }
}
