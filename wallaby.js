module.exports = wallaby => {
  process.env.NODE_ENV = 'test'

  return {
    files: [
      { pattern: 'index.js', load: false },
      { pattern: 'package.json', load: false },
      { pattern: '__tests__/**/*.snap', load: false }
    ],
    tests: ['__tests__/**/*.js'],

    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'jest',
    compilers: {
      '**/*.js': wallaby.compilers.babel({ babelrc: true })
    },
    setup(wallaby) {
      // eslint-disable-next-line global-require
      const conf = require('./package.json').jest
      wallaby.testFramework.configure(conf)
    }
  }
}
