/* eslint-disable */
var isSet = false

module.exports = function(config, makeThennable) {
  if (!isSet) setHasPlugin()
  if (makeThennable === false) return config

  var load = config.load
  config.then = cb => load().then(res => cb && cb(res))
  config.catch = cb => load().catch(e => cb && cb(e))
  return config
}

function setHasPlugin() {
  var universal
  var isWebpack = typeof __webpack_require__ !== 'undefined'

  try {
    if (isWebpack) {
      var weakId = require.resolveWeak('react-universal-component')
      universal = __webpack_require__(weakId)
    } else {
      var pkg = 'react-universal-component'
      universal = module.require(pkg)
    }

    if (universal) {
      universal.setHasBabelPlugin()
      isSet = true
    }
  } catch (e) {}
}
