
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
    'non-universal import':
      'import("./Component")',
    'import from static path': `
      import universal from 'react-universal-component'
      universal(import('./Component'))`,
    'import with babelServer: true': {
      code: `
        import universal from 'react-universal-component'
        universal(import('./Component'))`,
      pluginOptions: { babelServer: true }
    },
    'import with disableWarnings: true': {
      code: `
        import universal from 'react-universal-component'
        universal(import('./Component'))`,
      pluginOptions: { disableWarnings: true }
    },
    'import from static path with file extension': `
      import universal from 'react-universal-component'
      universal(import('./Component.js'))`,
    'import from static path relative to grand parent folder': `
      import universal from 'react-universal-component'
      universal(import('../../Component'))`,
    'import from static path relative to parent sub folder': `
      import universal from 'react-universal-component'
      universal(import(\`../components/Component\`))`,
    'import from static template string path': `
      import universal from 'react-universal-component'
      universal(import(\`./Component\`))`,
    'import from static template string path relative to grand parent folder': `
      import universal from 'react-universal-component'
      universal(import(\`../../Component\`))`,
    'import from dynamic template string path': `
      import universal from 'react-universal-component'
      universal(import(\`./\${page}\`))`,
    'import from dynamic template string path relative to sub folder': `
      import universal from 'react-universal-component'
      universal(import(\`./components/\${page}\`))`,
    'import from dynamic template string path relative to deep sub folder': `
      import universal from 'react-universal-component'
      universal(import(\`./components/\${page}/nested/Component\`))`,
    'import from dynamic template string path relative to deep sub folder (two tags)': `
      import universal from 'react-universal-component'
      universal(import(\`./components/\${page}/nested/\${another}Component\`))`,
    'import from dynamic template string path relative to grand parent folder': `
      import universal from 'react-universal-component'
      universal(import(\`../../components/\${page}\`))`,
    'import from static path assigned to variable': `
      import universal from 'react-universal-component'
      const component = import('./Component')
      universal(component)`,
    'import from static path returned by function': `
      import universal from 'react-universal-component'
      universal(function () { return import('./Component') })`,
    'import from static path returned by arrow function': `
      import universal from 'react-universal-component'
      universal(() => { return import('./Component') })`,
    'import from static path returned by arrow function with implicit return': `
      import universal from 'react-universal-component'
      universal(() => import('./Component'))`,
    'import from static path returned by arrow function assigned to a variable': `
      import universal from 'react-universal-component'
      const loadingFn = () => { return import('./Component') }
      universal(loadingFn)`,
    'import from static path returned by arrow function with implicit return assigned to a variable': `
      import universal from 'react-universal-component'
      const loadingFn = () => import('./Component')
      universal(loadingFn)`,
    'import from static path returned by function declaration': `
      import universal from 'react-universal-component'
      function loadingFn() { return import('./Component') }
      universal(loadingFn)`,
    'import from static path returned by function assigned to a variable': `
      import universal from 'react-universal-component'
      const loadingFn = function () { return import('./Component') }
      universal(loadingFn)`,
    'import from static path returned by async function': `
      import universal from 'react-universal-component'
      universal(async ({ page }) => await import(\`../components/\${page}\`))`,
    'import from static path returned by function assigned to object property': `
      import universal from 'react-universal-component'
      const obj = { component: () => universal(import('../components/Component')) };
      () => obj.component()`,
    'import returned by async function that should return a thennable without calling .then': `
      import universal from 'react-universal-component'
      universal(async ({ page }) => await import(\`../components/\${page}\`))`,
    'multiple imports': `
      import universal from 'react-universal-component'
      universal(import('one'))
      universal(import('two'))
      universal(import('three'))`,
    'import with custom webpackChunkName': `
      import universal from 'react-universal-component'
      universal(import(/* webpackChunkName: 'Bar' */'./Component'))`,
    'import with custom webpackChunkName + webpackmode': `
      import universal from 'react-universal-component'
      universal(import(/* webpackChunkName: 'Bar'*//* webpackMode: 'Lazy' */'./Component'))`,
    'import with custom webpackChunkName + webpackmode + webpackInclude': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        './Component'))`,
    'import with custom webpackChunkName + webpackmode + webpackInclude + webpackExclude': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        './Component'))`,
    'import with custom webpackChunkName + webpackmode + webpackInclude + webpackExclude + webpackIgnore': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackChunkName: 'Bar'*/
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        /* webpackIgnore: true */
        './Component'))`,
    'import with custom webpackChunkName + webpackPreload': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackChunkName: 'Bar'*/
        /* webpackPreload: true */
        './Component'))`,
    'import with custom webpackChunkName + webpackPrefetch': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackChunkName: 'Bar'*/
        /* webpackPrefetch: true */
        './Component'))`,
    'import with custom webpackChunkName + strips out unknown things': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackFakeProperty1: 'Lazy' */
        /* webpackChunkName: 'Bar'*/
        /* webpackFakeProperty3123: /foobar/ */
        './Component'))`,
    'import with custom webpackmode': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackMode: 'Lazy' */
        './Component'))`,
    'import with custom webpackmode + webpackInclude': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        './Component'))`,
    'import with custom webpackmode + webpackInclude + webpackExclude': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        './Component'))`,
    'import with custom webpackmode + webpackInclude + webpackExclude + webpackIgnore': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackMode: 'Lazy' */
        /* webpackInclude: /*.js$/ */
        /* webpackExclude: /(?!*test.js)$/ */
        /* webpackIgnore: true */
        './Component'))`,
    'import with custom webpackPreload': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackPreload: true */
        './Component'))`,
    'import with custom webpackPrefetch': `
      import universal from 'react-universal-component'
      universal(import(
        /* webpackPrefetch: true */
        './Component'))`
  }
})

// toggle from test.skip to test.only when working on the plugin using Wallaby
test.skip('wallaby-live-coding', () => {
  // const input = 'async ({ page }) => await import(`../components/${page}`);'
  // const input = 'import("../../Component.js")'
  // const input = 'universal(props => import(`./footer/${props.experiment}`));'
  const input = `import(\`./base/\${page}/index\`)`

  const output = babel.transform(
    input,
    { ...babelOptions, plugins: babelOptions.plugins.concat([plugin]) }
  )

  expect(output.code).toBeDefined()
})
