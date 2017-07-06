/* eslint-disable */

module.exports = function(chunkName) {
  var href = getHref(chunkName)
  if (!chunkName) return

  var head = document.getElementsByTagName('head')[0]
  var link = document.createElement('link')

  link.href = href
  link.charset = 'utf-8'
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.timeout = 30000

  return new Promise((resolve, reject) => {
    var timeout

    link.onerror = function() {
      link.onerror = link.onload = null // avoid mem leaks in IE.
      clearTimeout(timeout)
      var message = `could not load css chunk:${chunkName}`
      reject(new Error(message))
    }

    // link.onload doesn't work well enough, but this will handle it
    // since images can't load css (this is a popular fix)
    var img = document.createElement('img')
    img.onerror = function() {
      link.onerror = img.onerror = null // avoid mem leaks in IE.
      clearTimeout(timeout)
      resolve()
    }

    timeout = setTimeout(link.onerror, link.timeout)
    head.appendChild(link)
    img.src = href
  })
}

function getHref(chunkName) {
  if (typeof window === 'undefined' || !window.__CSS_CHUNKS__) return null
  return window.__CSS_CHUNKS__[chunkName]
}
