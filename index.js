'use-strict'

const { addDefault } = require('@babel/helper-module-imports')

const visited = Symbol('visited')

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

function getImportArgPath(p) {
  return p.parentPath.get('arguments')[0]
}

function trimChunkNameBaseDir(baseDir) {
  return baseDir.replace(/^[./]+|(\.js$)/g, '')
}

function prepareChunkNamePath(path) {
  return path.replace(/\//g, '-')
}

function getImport(p, { id, source, nameHint }) {
  if (!p.hub.file[id]) {
    p.hub.file[id] = addDefault(p, source, { nameHint })
  }

  return p.hub.file[id]
}

function createTrimmedChunkName(t, importArgNode) {
  if (importArgNode.quasis) {
    let quasis = importArgNode.quasis.slice(0)
    const baseDir = trimChunkNameBaseDir(quasis[0].value.cooked)
    quasis[0] = Object.assign({}, quasis[0], {
      value: { raw: baseDir, cooked: baseDir }
    })

    quasis = quasis.map((quasi, i) => (i > 0 ? prepareQuasi(quasi) : quasi))

    return Object.assign({}, importArgNode, {
      quasis
    })
  }

  const moduleName = trimChunkNameBaseDir(importArgNode.value)
  return t.stringLiteral(moduleName)
}

function prepareQuasi(quasi) {
  const newPath = prepareChunkNamePath(quasi.value.cooked)

  return Object.assign({}, quasi, {
    value: { raw: newPath, cooked: newPath }
  })
}

function getMagicCommentChunkName(importArgNode) {
  const { quasis, expressions } = importArgNode
  if (!quasis) return trimChunkNameBaseDir(importArgNode.value)

  const baseDir = quasis[0].value.cooked
  const hasExpressions = expressions.length > 0
  const chunkName = baseDir + (hasExpressions ? '[request]' : '')

  return trimChunkNameBaseDir(chunkName)
}

function getComponentId(t, importArgNode) {
  const { quasis, expressions } = importArgNode
  if (!quasis) return importArgNode.value

  return quasis.reduce((str, quasi, i) => {
    const q = quasi.value.cooked
    const id = expressions[i] && expressions[i].name
    return str + (id ? `${q}\${${id}}` : q)
  }, '')
}

function existingMagicCommentChunkName(importArgNode) {
  const { leadingComments } = importArgNode

  if (leadingComments) {
    const data = leadingComments
      .map((comment, index) => {
        if (comment.value.indexOf('webpackChunkName') !== -1) {
          let parsed
          try {
            parsed = JSON5.parse(`{${comment.value}}`)
          }
          catch (error) {
            return null
          }

          const value = parsed && parsed.webpackChunkName
          if (value) {
            // Cleanup comment from old chunk name
            delete parsed.webpackChunkName
            comment.value = JSON5.stringify(parsed).slice(1, -1)

            // Remove empty comments
            if (comment.value === '') {
              leadingComments.splice(index, 1)
            }

            return value
          }
        }

        return null
      })
      .filter(Boolean)

    // Last entry wins
    return data.pop()
  }

  return null
}

function idOption(t, importArgNode) {
  const id = getComponentId(t, importArgNode)
  return t.objectProperty(t.identifier('id'), t.stringLiteral(id))
}

function fileOption(t, p) {
  return t.objectProperty(
    t.identifier('file'),
    t.stringLiteral(p.hub.file.opts.filename)
  )
}

function loadOption(t, loadTemplate, p, importArgNode) {
  const argPath = getImportArgPath(p)
  const generatedChunkName = getMagicCommentChunkName(importArgNode)
  const existingChunkName = t.existingChunkName
  const chunkName = existingChunkName || generatedChunkName

  argPath.addComment('leading', ` webpackChunkName: '${chunkName}' `)

  const load = loadTemplate({
    IMPORT: argPath.parent
  }).expression

  return t.objectProperty(t.identifier('load'), load)
}

function pathOption(t, pathTemplate, p, importArgNode) {
  const path = pathTemplate({
    PATH: getImport(p, IMPORT_PATH_DEFAULT),
    MODULE: importArgNode
  }).expression

  return t.objectProperty(t.identifier('path'), path)
}

function resolveOption(t, resolveTemplate, importArgNode) {
  const resolve = resolveTemplate({
    MODULE: importArgNode
  }).expression

  return t.objectProperty(t.identifier('resolve'), resolve)
}

function chunkNameOption(t, chunkNameTemplate, importArgNode) {
  const existingChunkName = t.existingChunkName
  const generatedChunk = createTrimmedChunkName(t, importArgNode)
  const trimmedChunkName = existingChunkName
    ? t.stringLiteral(existingChunkName)
    : generatedChunk

  const chunkName = chunkNameTemplate({
    MODULE: trimmedChunkName
  }).expression

  return t.objectProperty(t.identifier('chunkName'), chunkName)
}

function checkForNestedChunkName(node) {
  const generatedChunkName = getMagicCommentChunkName(node)
  const isNested =
    generatedChunkName.indexOf('[request]') === -1 &&
    generatedChunkName.indexOf('/') > -1
  return isNested && prepareChunkNamePath(generatedChunkName)
}

module.exports = function universalImportPlugin({ types: t, template }) {
  const chunkNameTemplate = template('() => MODULE')
  const pathTemplate = template('() => PATH.join(__dirname, MODULE)')
  const resolveTemplate = template('() => require.resolveWeak(MODULE)')
  const loadTemplate = template('() => IMPORT')

  return {
    name: 'universal-import',
    visitor: {
      Import(p) {
        if (p[visited]) return
        p[visited] = true

        const importArgNode = getImportArgPath(p).node
        t.existingChunkName = existingMagicCommentChunkName(importArgNode)
        // no existing chunkname, no problem - we will reuse that for fixing nested chunk names
        if (!t.existingChunkName) {
          t.existingChunkName = checkForNestedChunkName(importArgNode)
        }
        const universalImport = getImport(p, IMPORT_UNIVERSAL_DEFAULT)

        // if being used in an await statement, return load() promise
        if (
          p.parentPath.parentPath.isYieldExpression() || // await transformed already
          t.isAwaitExpression(p.parentPath.parentPath.node) // await not transformed already
        ) {
          const func = t.callExpression(universalImport, [
            loadOption(t, loadTemplate, p, importArgNode).value,
            t.booleanLiteral(false)
          ])

          p.parentPath.replaceWith(func)
          return
        }

        const opts = this.opts.babelServer
          ? [
            idOption(t, importArgNode),
            fileOption(t, p),
            pathOption(t, pathTemplate, p, importArgNode),
            resolveOption(t, resolveTemplate, importArgNode),
            chunkNameOption(t, chunkNameTemplate, importArgNode)
          ]
          : [
            idOption(t, importArgNode),
            fileOption(t, p),
            loadOption(t, loadTemplate, p, importArgNode),
            pathOption(t, pathTemplate, p, importArgNode),
            resolveOption(t, resolveTemplate, importArgNode),
            chunkNameOption(t, chunkNameTemplate, importArgNode)
          ]

        const options = t.objectExpression(opts)

        const func = t.callExpression(universalImport, [options])
        delete t.existingChunkName
        p.parentPath.replaceWith(func)
      }
    }
  }
}
