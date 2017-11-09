'use-strict'

module.exports = function ({ types: t, template }) {
  const visited = Symbol('visited')
  const universalImportId = Symbol('universalImportId')
  const importCssId = Symbol('importCssId')
  const pathId = Symbol('pathId')

  const chunkNameTemplate = template('() => MODULE')
  const pathTemplate = template('() => PATH.join(__dirname, MODULE)')
  const resolveTemplate = template('() => require.resolveWeak(MODULE)')
  const loadTemplate = template(
    '() => Promise.all([IMPORT, IMPORT_CSS(MODULE, CSS_OPTIONS)]).then(proms => proms[0])'
  )

  function getImportArgPath(p) {
    return p.parentPath.get('arguments')[0]
  }

  function trimChunkNameBaseDir(baseDir) {
    return baseDir.replace(/^[./]+|(\.js$)/g, '')
  }

  function prepareChunkNamePath(path) {
    return path.replace(/\//g, '-')
  }

  function getUniversalImport(p) {
    if (!p.hub.file[universalImportId]) {
      const universal = p.hub.file.addImport(
        'babel-plugin-universal-import/universalImport.js',
        'default',
        'universalImport'
      )
      p.hub.file[universalImportId] = universal
    }

    return p.hub.file[universalImportId]
  }

  function getImportCss(p) {
    if (!p.hub.file[importCssId]) {
      const importCss = p.hub.file.addImport(
        'babel-plugin-universal-import/importCss.js',
        'default',
        'importCss'
      )
      p.hub.file[importCssId] = importCss
    }

    return p.hub.file[importCssId]
  }

  function getPath(p) {
    if (!p.hub.file[pathId]) {
      const path = p.hub.file.addImport('path', 'default', 'path')
      p.hub.file[pathId] = path
    }

    return p.hub.file[pathId]
  }

  function createTrimmedChunkName(importArgNode) {
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

  function getComponentId(importArgNode) {
    const { quasis, expressions } = importArgNode
    if (!quasis) return importArgNode.value

    return quasis.reduce((str, quasi, i) => {
      const q = quasi.value.cooked
      const id = expressions[i] && expressions[i].name
      return (str += id ? `${q}\${${id}}` : q)
    }, '')
  }

  function idOption(importArgNode) {
    const id = getComponentId(importArgNode)
    return t.objectProperty(t.identifier('id'), t.stringLiteral(id))
  }

  function fileOption(p) {
    return t.objectProperty(
      t.identifier('file'),
      t.stringLiteral(p.hub.file.opts.filename)
    )
  }

  function getCssOptionExpression(cssOptions) {
    const opts = Object.keys(cssOptions).reduce((options, option) => {
      const cssOption = cssOptions[option]
      const optionType = typeof cssOption

      if (optionType !== 'undefined') {
        const optionProperty = t.objectProperty(
          t.identifier(option),
          t[`${optionType}Literal`](cssOption)
        )

        options.push(optionProperty)
      }

      return options
    }, [])

    return t.objectExpression(opts)
  }

  function loadOption(p, importArgNode, cssOptions) {
    const argPath = getImportArgPath(p)
    const chunkName = getMagicCommentChunkName(importArgNode)

    delete argPath.node.leadingComments
    argPath.addComment('leading', ` webpackChunkName: '${chunkName}' `)

    const cssOpts = getCssOptionExpression(cssOptions)
    const load = loadTemplate({
      IMPORT: argPath.parent,
      IMPORT_CSS: getImportCss(p),
      MODULE: createTrimmedChunkName(importArgNode),
      CSS_OPTIONS: cssOpts
    }).expression

    return t.objectProperty(t.identifier('load'), load)
  }

  function pathOption(p, importArgNode) {
    const path = pathTemplate({
      PATH: getPath(p),
      MODULE: importArgNode
    }).expression

    return t.objectProperty(t.identifier('path'), path)
  }

  function resolveOption(importArgNode) {
    const resolve = resolveTemplate({
      MODULE: importArgNode
    }).expression

    return t.objectProperty(t.identifier('resolve'), resolve)
  }

  function chunkNameOption(importArgNode) {
    const chunkName = chunkNameTemplate({
      MODULE: createTrimmedChunkName(importArgNode)
    }).expression

    return t.objectProperty(t.identifier('chunkName'), chunkName)
  }

  return {
    name: 'universal-import',
    visitor: {
      Import(p) {
        if (p[visited]) return
        p[visited] = true

        const importArgNode = getImportArgPath(p).node
        const universalImport = getUniversalImport(p)
        const cssOptions = {
          disableWarnings: this.opts.disableWarnings
        }

        // if being used in an await statement, return load() promise
        if (
          p.parentPath.parentPath.isYieldExpression() || // await transformed already
          t.isAwaitExpression(p.parentPath.parentPath.node) // await not transformed already
        ) {
          const func = t.callExpression(universalImport, [
            loadOption(p, importArgNode, cssOptions).value,
            t.booleanLiteral(false)
          ])

          return p.parentPath.replaceWith(func)
        }

        const opts = this.opts.babelServer
          ? [
            idOption(importArgNode),
            fileOption(p),
            pathOption(p, importArgNode),
            resolveOption(importArgNode),
            chunkNameOption(importArgNode)
          ]
          : [
            idOption(importArgNode),
            fileOption(p),
            loadOption(p, importArgNode, cssOptions), // only when not on a babel-server
            pathOption(p, importArgNode),
            resolveOption(importArgNode),
            chunkNameOption(importArgNode)
          ]

        const options = t.objectExpression(opts)

        const func = t.callExpression(universalImport, [options])
        p.parentPath.replaceWith(func)
      }
    }
  }
}
