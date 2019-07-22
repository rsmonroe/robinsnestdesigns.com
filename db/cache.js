const LRU = require("lru-cache")

class NamespacedCache {
  constructor(options) {
    this.cache = new LRU(options)
    this.namespaces = {}
  }

  get(key) {
    return this.cache.get(key)
  }

  set(key, value, namespace) {
    this.cache.set(key, value)
    if (!this.namespaces[ns])
      this.namespaces[ns] = []
    this.namespaces[ns].push(key)
  }

  invalidate(namespace) {
    if (!this.namespaces[ns]) return
    for (const key of this.namespaces[ns]) {
      this.cache.del(key)
    }
  }
}

module.exports = NamespacedCache
