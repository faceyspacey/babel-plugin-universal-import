/* eslint-disable */

module.exports = function(config, makeThennable) {
  if (makeThennable === false) return config

  var load = config.load
  config.then = function(cb) {
    return load().then(function(res) {
      return cb && cb(res)
    })
  }
  config.catch = function(cb) {
    return load().catch(function(e) {
      return cb && cb(e)
    })
  }
  return config
}

var isSet = false

function setHasPlugin() {
  if (isSet) return
  var universal
  var isWebpack = typeof __webpack_require__ !== 'undefined'

  try {
    if (isWebpack) {
      var weakId = require.resolveWeak('react-universal-component')
      universal = __webpack_require__(weakId)
    } else {
      var nodeRequire = typeof __non_webpack_require__ === 'undefined' ? module.require : __non_webpack_require__
      universal = nodeRequire('react-universal-component')
    }

    if (universal) {
      universal.setHasBabelPlugin()
      isSet = true
    }
  } catch (e) {}
}

setHasPlugin()
