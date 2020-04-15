const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const packageJson = require('./package.json')

const baseUrl = process.env.NODE_ENV === 'production'
  ? process.env.NODE_NETLIFY === 'true'
    ? '/'
    : '/layered-vj/'
  : '/'
const outputDir = process.env.NODE_ENV === 'production'
  ? 'docs'
  : 'dist'

module.exports = {
  baseUrl,
  outputDir,
  productionSourceMap: false,
  configureWebpack: {
    entry: {
      visual: ['./src/visual/main.js']
    },
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
        chunks: ['visual'],
        filename: 'visual.html',
        template: path.resolve('public/visual.html')
      })
    ]
  },
  chainWebpack: config => {
    config.optimization.delete('splitChunks')

    config
      .plugin('define')
      .tap(args => {
        args[0]['process.env']['VERSION'] = JSON.stringify(packageJson.version)
        args[0]['process.env']['DESCRIPTION'] = JSON.stringify(packageJson.description)
        return args
      })

    config
      .plugin('html')
      .tap(args => {
        args[0].excludeChunks = ['visual']
        return args
      })

    config
      .plugin('copy')
      .tap(args => {
        args[0].push(
          {
            from: path.resolve('src/control/assets'),
            to: path.resolve(outputDir + '/assets'),
            ignore: [
              '.*'
            ]
          },
          // {
          //   from: path.resolve('src/control/_assets'),
          //   to: path.resolve(outputDir + '/_assets'),
          //   ignore: [
          //     '.*'
          //   ]
          // },
          {
            from: path.resolve('src/visual/assets'),
            to: path.resolve(outputDir + '/src/visual/assets'),
            ignore: [
              '.*'
            ]
          }
          // {
          //   from: path.resolve('src/visual/_assets'),
          //   to: path.resolve(outputDir + '/src/visual/_assets'),
          //   ignore: [
          //     '.*'
          //   ]
          // }
        )
        return args
      })
  }
}
