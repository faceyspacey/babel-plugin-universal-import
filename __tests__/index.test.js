/* eslint-disable no-template-curly-in-string */

const pluginTester = require('babel-plugin-tester')
const createBabylonOptions = require('babylon-options')
const babel = require('@babel/core')
const plugin = require('../index')

const babelOptions = {
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
    'import from static path': 'import("./Component")',
    'import from static path relative to grand parent folder': 'import("../../Component")',
    'import from static path with file extension': 'import("./Component.js")',
    'import from static template string path': 'import(`./Component`)',
    'import from static template string path relative to grand parent folder': 'import(`../../Component`)',
    'import from static path returned by function assigned to object property':
      'const obj = {component:()=>import(`../components/Component`)}; ()=> obj.component()',
    'import from static path relative to parent sub folder':
      'import(`../components/Component`)',
    'import from dynamic template string path relative to sub folder': 'import(`./components/${page}`)',
    'import from dynamic template string path relative to deep sub folder':
      'import(`./components/${page}/nested/Component`)',
    'import from dynamic template string path relative to deep sub folder (two tags)':
      'import(`./components/${page}/nested/${another}Component`)',
    'import from dynamic template string path':
      'import(`./${page}`)',
    'import from dynamic template string path relative to grand parent folder':
      'import(`../../components/${page}`)',
    'import returned by async function that should return a thennable without calling .then':
      'async ({ page }) => await import(`../components/${page}`);',
    'import with babelServer: true': {
      code: 'import("./Component")',
      pluginOptions: { babelServer: true }
    },
    'import with disableWarnings: true': {
      code: 'import("./Component")',
      pluginOptions: { disableWarnings: true }
    },
    'import with custom webpackChunkName': 'import(/* webpackChunkName: \'Bar\' */"./Component")',
    'multiple imports': 'import("one"); import("two"); import("three");',
    'import with custom webpackChunkName + webpackmode': `import(/* webpackChunkName: 'Bar'*//* webpackMode: "Lazy" */"./Component")`,
    'import with custom webpackChunkName + webpackmode + webpackInclude': `
      import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        "./Component")`,
    'import with custom webpackChunkName + webpackmode + webpackInclude + webpackExclude': `
      import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        "./Component")`,
    'import with custom webpackChunkName + webpackmode + webpackInclude + webpackExclude + webpackIgnore': `
      import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        /* webpackIgnore: true */
        "./Component")`,
    'import with custom webpackChunkName + strips out unknown things': `
      import(
        /* webpackFakeProperty1: "Lazy" */
        /* webpackChunkName: 'Bar'*/
        /* webpackFakeProperty3123: /foobar/ */
        "./Component")`,
    'import with custom webpackmode + webpackInclude + webpackExclude + webpackIgnore': `
      import(
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        /* webpackIgnore: true */
        "./Component")`,
    'import with custom webpackmode + webpackInclude + webpackExclude': `
      import(
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        "./Component")`,
    'import with custom webpackmode + webpackInclude': `
      import(
        /* webpackMode: "Lazy" */
        /* webpackInclude: /*.js$/ */
        "./Component")`,
    'import with custom webpackmode': `
      import(
        /* webpackMode: "Lazy" */
        "./Component")`,
    'import with custom webpackPreload': `
      import(
        /* webpackPreload: true */
        "./Component")`,
    'import with custom webpackPrefetch': `
      import(
        /* webpackPrefetch: true */
        "./Component")`,
    'import with custom webpackChunkName + webpackPreload': `
      import(
        /* webpackChunkName: 'Bar'*/
        /* webpackPreload: true */
        "./Component")`,
    'import with custom webpackChunkName + webpackPrefetch': `
      import(
        /* webpackChunkName: 'Bar'*/
        /* webpackPrefetch: true */
        "./Component")`
  }
})

// toggle from test.skip to test.only when working on the plugin using Wallaby
test.skip('wallaby-live-coding', () => {
  // const input = 'async ({ page }) => await import(`../components/${page}`);'
  // const input = 'import("../../Component.js")'
  // const input = 'universal(props => import(`./footer/${props.experiment}`));'
  const input = 'import(`./base/${page}/index`)'

  const output = babel.transform(
    input,
    { ...babelOptions, plugins: babelOptions.plugins.concat([plugin]) }
  )

  expect(output.code).toBeDefined()
})
