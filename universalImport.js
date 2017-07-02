module.exports = function (config, makeThennable) {
  if (makeThennable === false) return config

  const load = config.load
  config.then = cb => load().then(res => cb && cb(res))
  config.catch = cb => load().catch(e => cb && cb(e))
  return config
}
