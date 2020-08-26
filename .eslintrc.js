module.exports = {
  parserOptions: {
    sourceType: 'module'
  },
  extends: ['airbnb'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js']
      }
    }
  },
  globals: {
    __dirname: true,
    expect: true,
    jest: true,
    process: true,
    test: true
  },
  rules: {
    'arrow-parens': [2, 'as-needed', { requireForBlockBody: false }],
    'brace-style': [2, 'stroustrup'],
    camelcase: 1,
    'comma-dangle': [
      2,
      {
        arrays: 'never',
        objects: 'never',
        imports: 'never',
        exports: 'never',
        functions: 'never'
      }
    ],
    'consistent-return': 1,
    'dot-notation': 1,
    'global-require': 1,
    'import/extensions': ['error', 'always', { js: 'never' }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        optionalDependencies: true,
        peerDependencies: true
      }
    ],
    'import/no-named-default': 1,
    'import/no-unresolved': [2, { commonjs: true, caseSensitive: true }],
    'import/prefer-default-export': 1,
    'max-len': [
      'error',
      {
        code: 80,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'no-case-declarations': 1,
    'no-confusing-arrow': 0,
    'no-console': 1,
    'no-multi-assign': 1,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-return-assign': 1,
    'no-shadow': 0,
    'no-template-curly-in-string': 1,
    'no-underscore-dangle': 0,
    'no-unused-expressions': [
      1,
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }
    ],
    'no-unused-vars': 1,
    'no-use-before-define': 0,
    'prefer-template': 1,
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: [2, 'never'],
    'spaced-comment': [2, 'always', { markers: ['?'] }]
  }
}
