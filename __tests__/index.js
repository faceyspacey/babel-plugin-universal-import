/* eslint-disable no-template-curly-in-string */

const pluginTester = require('babel-plugin-tester')
const createBabylonOptions = require('babylon-options')
const plugin = require('../index')
const babel = require('@babel/core')

const babelOptions = {
  filename: '/dev/null',
  parserOpts: createBabylonOptions({
    plugins: ['dynamicImport']
  }),
  presets: ['@babel/preset-react'],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-transform-modules-commonjs', { strictMode: false }]
  ],
  babelrc: false
}

pluginTester({
  plugin,
  babelOptions,
  snapshot: true,
  tests: {
    'static import': 'import("./Foo")',
    'static import (with relative paths)': 'import("../../Foo")',
    'static import (with file extension)': 'import("./Foo.js")',
    'static import (string template)': 'import(`./base`)',
    'static import (string template + relative paths)': 'import(`../../base`)',
    'static import (import as function with relative paths + nested folder)':
      'const obj = {component:()=>import(`../components/nestedComponent`)}; ()=> obj.component()',
    'static import (relative paths + nested folder)':
      'import(`../components/nestedComponent`)',
    'dynamic import (string template)': 'import(`./base/${page}`)',
    'dynamic import (string template with nested folder)':
      'import(`./base/${page}/nested/folder`)',
    'dynamic import (string template with multiple nested folders)':
      'import(`./base/${page}/nested/{$another}folder`)',
    'dynamic import (string template - dynamic at 1st segment)':
      'import(`./${page}`)',
    'dynamic import (string template + relative paths)':
      'import(`../../base/${page}`)',
    'await import() should receive a thennable without calling .then':
      'async ({ page }) => await import(`../components/${page}`);',
    'babelServer: true': {
      code: 'import("./Foo")',
      pluginOptions: { babelServer: true }
    },
    'disableWarnings: true': {
      code: 'import("./Foo")',
      pluginOptions: { disableWarnings: true }
    },
    'existing chunkName': 'import(/* webpackChunkName: \'Bar\' */"./Foo")',
    'multiple imports': 'import("one"); import("two"); import("three");'
  }
})

// toggle from test.skip to test.only when working on the plugin using Wallaby
test.skip('wallaby-live-coding', () => {
  // const input = 'async ({ page }) => await import(`../components/${page}`);'
  // const input = 'import("../../Foo.js")'
  // const input = 'universal(props => import(`./footer/${props.experiment}`));'
  const input = 'import(`./base/${page}/index`)'

  const output = babel.transform(
    input,
    Object.assign({}, babelOptions, {
      plugins: babelOptions.plugins.concat([plugin])
    })
  )

  expect(output.code).toBeDefined()
})
