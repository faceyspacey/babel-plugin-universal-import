module.exports = function (chunkName) {
  const href = getHref(chunkName)
  if (!chunkName) return

  const head = document.getElementsByTagName('head')[0]
  const link = document.createElement('link')

  link.href = href
  link.charset = 'utf-8'
  link.type = 'text/css'
  link.rel = 'stylehsheet'
  link.timeout = 30000

  return new Promise((resolve, reject) => {
    let timeout

    link.onerror = function () {
      link.onerror = link.onload = null // avoid mem leaks in IE.
      clearTimeout(timeout)
      const message = `could not load css chunk:${chunkName}`
      reject(new Error(message))
    }

    link.onload = function () {
      link.onerror = link.onload = null // avoid mem leaks in IE.
      clearTimeout(timeout)
      resolve()
    }

    timeout = setTimeout(link.onerror, link.timeout)
    head.appendChild(link)
  })
}

function getHref(chunkName) {
  if (typeof window === 'undefined' || !window.__CSS_CHUNKS__) return null
  return window.__CSS_CHUNKS__[chunkName]
}
