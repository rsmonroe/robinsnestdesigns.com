const retry = require('async-retry')
const NamespacedCache = require('./cache')
const migrate = require('./migrate')
const knex = require('../knex')

// TODO: tune these params
const CACHE_MAX_SIZE = 2 << 20
const CACHE_MAX_AGE = 5 * 60 * 1000

const QUERY_RETRIES = 10
const QUERY_DELAY_MIN = 100
const QUERY_DELAY_FACTOR = 2

const cache = new NamespacedCache({
  max: CACHE_MAX_SIZE,
  maxAge: CACHE_MAX_AGE,
  // TODO: account for size of dataset
  length: (n, key) => key.length,
})

const runQuery = async (query) => {
  return await retry(async bail => {
    // TODO: bail logic
    return await query
  }, {
    retries: QUERY_RETRIES,
    factor: QUERY_DELAY_FACTOR,
    minTimeout: QUERY_DELAY_MIN,
    randomize: true,
  })
}

const readDB = async (query, namespace) => {
  await migrate()
  const key = query.toString()
  let queryPromise = cache.get(key)
  if (!queryPromise) {
    queryPromise = runQuery(query)
    cache.set(key, queryPromise, namespace)
  }
  return await Promise.resolve(queryPromise)
}

const writeDB = async (query, namespace) => {
  await migrate()
  cache.invalidate(namespace)
  // TODO: the current awaiters of promises in namespaces will prolly still see old data
  // TODO retry updates/inserts?
  return await query
}

module.exports = {
  knex,
  readDB,
  writeDB,
}
