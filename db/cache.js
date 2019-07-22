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
    if (!this.namespaces[namespace])
      this.namespaces[namespace] = []
    this.namespaces[namespace].push(key)
  }

  invalidate(namespace) {
    if (!this.namespaces[namespace]) return
    for (const key of this.namespaces[namespace]) {
      this.cache.del(key)
    }
  }
}

module.exports = NamespacedCache
