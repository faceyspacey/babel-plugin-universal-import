'use-strict'

const { addDefault } = require('@babel/helper-module-imports')
const path = require('path')

const validMagicStrings = [
  'webpackMode',
  // 'webpackMagicChunkName' gets dealt with current implementation & naming/renaming strategy
  'webpackInclude',
  'webpackExclude',
  'webpackIgnore',
  'webpackPreload',
  'webpackPrefetch'
]

const IMPORT_UNIVERSAL_DEFAULT = {
  id: Symbol('universalImportId'),
  source: 'babel-plugin-universal-import/universalImport',
  nameHint: 'universalImport'
}

const IMPORT_PATH_DEFAULT = {
  id: Symbol('pathId'),
  source: 'path',
  nameHint: 'path'
}

function prepareQuasi({ value: { cooked }, ...quasi }) {
  return {
    ...quasi,
    value: {
      raw: cooked,
      cooked
    }
  }
}

function createTrimmedChunkName({ node }, t) {
  if (node.quasis) {
    const quasis = node.quasis.slice()
    const baseDir = trimChunkNameBaseDir(quasis[0].value.cooked)

    quasis[0] = { ...quasis[0], value: { raw: baseDir, cooked: baseDir } }

    return {
      ...node,
      quasis: quasis.map((quasi, i) => i > 0 ? prepareQuasi(quasi) : quasi)
    }
  }

  const moduleName = trimChunkNameBaseDir(node.value)

  return t.stringLiteral(moduleName)
}

function chunkNameOption(p, t, template, chunkName) {
  const chunkNameFn = template({
    MODULE: chunkName
      ? t.stringLiteral(chunkName)
      : createTrimmedChunkName(p, t)
  })
  return t.objectProperty(t.identifier('chunkName'), chunkNameFn.expression)
}

function resolveOption({ node: MODULE }, t, template) {
  const resolve = template({ MODULE })
  return t.objectProperty(t.identifier('resolve'), resolve.expression)
}

function pathOption(p, { node: MODULE }, t, template) {
  const path = template({ MODULE, PATH: getImport(p, IMPORT_PATH_DEFAULT) })
  return t.objectProperty(t.identifier('path'), path.expression)
}

function includeFileNameOption(p, t) {
  const file = path.relative(__dirname, p.hub.file.opts.filename || '') || ''
  return t.objectProperty(t.identifier('file'), t.stringLiteral(file))
}

function getComponentId({ node: { expressions, quasis, value } }) {
  if (!quasis) {
    return value
  }

  return quasis.reduce(
    (str, { value: { cooked } }, i) => {
      const id = expressions[i] && expressions[i].name
      str += id ? `${cooked}\${${id}}` : cooked
      return str
    },
    ''
  )
}

function idOption(p, t) {
  const id = getComponentId(p)
  return t.objectProperty(t.identifier('id'), t.stringLiteral(id))
}

function getWebpackComments({ node: { leadingComments = [] } }) {
  return leadingComments.reduce((comments, { value }) => {
    const isMagicComment = validMagicStrings
      .filter(str => new RegExp(`${str}\\w*:`).test(value))
      .length === 1
    if (isMagicComment) {
      comments.push(value)
    }
    return comments
  }, [])
}

function trimChunkNameBaseDir(baseDir) {
  return baseDir.replace(/^[./]+|(\.js$)/g, '')
}

function createWebpackChunkName({ node: { expressions, quasis, value } }) {
  if (!quasis) {
    return trimChunkNameBaseDir(value)
  }

  const [{ value: { cooked: baseDir } }] = quasis
  const chunkName = baseDir + (expressions.length > 0 ? '[request]' : '')

  return trimChunkNameBaseDir(chunkName)
}

function loadOption(p, t, template, chunkName) {
  const magicComments = [
    ` webpackChunkName: '${chunkName || createWebpackChunkName(p)}' `,
    ...getWebpackComments(p)
  ]
  delete p.node.leadingComments
  magicComments.forEach(comment => p.addComment('leading', comment))
  const load = template({ IMPORT: p.parent })
  return t.objectProperty(t.identifier('load'), load.expression)
}

function getImport(p, { source, nameHint }) {
  return addDefault(p, source, { nameHint })
}

function getWebpackChunkName({ node: { leadingComments = [] } }) {
  const chunkNameComment = leadingComments.find(({ value }) => value.includes('webpackChunkName:'))
  if (chunkNameComment) {
    return chunkNameComment.value
      .split('webpackChunkName:')[1]
      .replace(/["'\s]/g, '')
  }
  return null
}

function transformImport(p, t, { blocking, templates, options }) {
  const [importArg] = p.parentPath.get('arguments')
  const chunkName = getWebpackChunkName(importArg)
  const universalImport = getImport(p, IMPORT_UNIVERSAL_DEFAULT)
  if (blocking) { // if being used in an await statement, return load() promise
    const universalArg = [
      loadOption(importArg, t, templates.load, chunkName).value,
      t.booleanLiteral(false)
    ]
    p.parentPath.replaceWith(t.callExpression(universalImport, universalArg))
    return
  }
  const opts = [idOption(importArg, t)]
  const { babelServer, includeFileName } = options
  if (includeFileName) {
    opts.push(includeFileNameOption(p, t))
  }
  if (!babelServer) {
    opts.push(loadOption(importArg, t, templates.load, chunkName))
  }
  opts.push(
    pathOption(p, importArg, t, templates.path),
    resolveOption(importArg, t, templates.resolve),
    chunkNameOption(importArg, t, templates.chunkName, chunkName)
  )
  const universalArg = t.objectExpression(opts)
  p.parentPath.replaceWith(t.callExpression(universalImport, [universalArg]))
}

function getFunctionDeclaration(p) {
  return p.find(p => p.isVariableDeclarator() || p.isFunctionDeclaration())
}

function isReturnExpression({ parentPath: p }) {
  return p.isArrowFunctionExpression() || p.isReturnStatement()
}

function isBlockingExpression(p) {
  return p.isAwaitExpression() || p.isYieldExpression()
}

function isBlockingImportCallExpression(p) {
  return isBlockingExpression(p) && p.get('argument.callee').isImport()
}

function findReturnImport(p) {
  let blocking = false
  let path
  if (isImportCallExpression(p)) {
    path = p.get('callee')
  }
  else if (isBlockingImportCallExpression(p)) {
    blocking = true
    path = p.get('argument.callee')
  }
  else if (p.isBlockStatement()) {
    const returnStatement = p.get('body').find(p => p.isReturnStatement())
    if (returnStatement && isImportCallExpression(returnStatement.get('argument'))) {
      path = returnStatement.get('argument.callee')
    }
  }
  return { blocking, path }
}

function isImportCallExpression(p) {
  return p.isCallExpression() && p.get('callee').isImport()
}

function isImportIdentifier(p) {
  return p.isIdentifier() && imports[p.node.name]
}

function findImport(p) {
  if (isImportIdentifier(p)) {
    return imports[p.node.name]
  }
  if (isImportCallExpression(p)) {
    return { blocking: false, path: p.get('callee') }
  }
  if (p.isFunctionExpression() || p.isArrowFunctionExpression()) {
    return findReturnImport(p.get('body'))
  }
  return { blocking: null, path: null }
}

let imports = {}
let universalImportSpecifier

module.exports = function universalImportPlugin({ types: t, template }) {
  const templates = {
    chunkName: template('() => MODULE'),
    path: template('() => PATH.join(__dirname, MODULE)'),
    resolve: template('() => require.resolveWeak(MODULE)'),
    load: template('() => Promise.all([IMPORT]).then(proms => proms[0])')
  }

  return {
    name: 'universal-import',
    visitor: {
      CallExpression(p) {
        if (!universalImportSpecifier
          || p.node.callee.name !== universalImportSpecifier) {
          return
        }
        const [universalArgPath] = p.get('arguments')
        const { blocking, path } = findImport(universalArgPath)
        if (!path) return
        transformImport(path, t, { blocking, templates, options: this.opts })
      },
      Import(p) {
        if (!universalImportSpecifier) return
        const importCall = p.parentPath
        const importCallParent = importCall.parentPath
        if (importCallParent.isVariableDeclarator()) {
          imports[importCallParent.node.id.name] = { blocking: false, path: p }
          return
        }
        const blocking = isBlockingExpression(importCallParent)
        if (isReturnExpression(importCall)
          || (blocking && isReturnExpression(importCallParent))) {
          const declaration = getFunctionDeclaration(importCallParent)
          if (declaration) {
            imports[declaration.node.id.name] = { blocking, path: p }
          } // else import() is eventually called as an argument in universal()
        }
      },
      ImportDeclaration(p) {
        if (p.node.source.value === 'react-universal-component') {
          const specifier = p.node.specifiers.find(t.isImportDefaultSpecifier)
          if (specifier) universalImportSpecifier = specifier.local.name
        }
      },
      Program: {
        exit() {
          // Cleanup module globals before compiling a new file
          imports = {}
          universalImportSpecifier = null
        }
      }
    }
  }
}
