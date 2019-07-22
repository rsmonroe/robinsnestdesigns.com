const { knex } = require('../db')
const searchEngine = require('../searchEngine')
const reduceProduct = require('../reducers/reduceProduct')
const getProduct = require('../db/Product/getProduct')
const getCategory = require('../db/Category/getCategory')
const getSubcategory = require('../db/Subcategory/getSubcategory')

const nextTick = () => new Promise((resolve, reject) => setTimeout(() => resolve(), 10 + Math.random() * 90))

const processProduct = async (productId) => {
  const [ row ] = await getProduct(productId)
  const product = reduceProduct(row)

  // we have to get extra data
  const getTitle = async (fn) => {
    const [ result ] = await fn()
    return result && result.Category
  }

  if (product.category2)
    product.category2 = await getTitle(() => getCategory(product.category2))
  if (product.category3)
    product.category3 = await getTitle(() => getCategory(product.category3))
  if (product.subcategory2)
    product.subcategory2 = await getTitle(() => getSubcategory(product.subcategory2))
  if (product.subcategory3)
    product.subcategory3 = await getTitle(() => getSubcategory(product.subcategory3))

  await searchEngine.add(product)
}

const processSuccess = (productId) => console.log('Imported', productId)

const processError = (productId, error) => console.error('Error importing', productId, error)

const THROTTLE_THRESHOLD = 0.05
const THROTTLE_DOWN_TIME_FACTOR = 3
const THROTTLE_UP_TIME_FACTOR = 3
const CONCURRENCY_GROWTH_FACTOR = 2
const CONCURRENCY_GROWTH_MIN = 2

const processAllProducts = async () => {
  const promises = []
  let concurrency = 32
  let nRunning = 0
  let nTotal = 0
  let lastBumpTime = 0
  let averageLatency = 0
  try {
    const query = knex.select('ID as productId')
                      .from('Products')
                      .where('Active', 1)
                      .whereNotIn('ID', builder => builder
                        .select('record')
                        .from(searchEngine.keywordTableName)
                        .distinct()
                      )
                      .stream()

    for await (const { productId } of query) {

      while (nRunning >= concurrency) {
        await nextTick()
      }

      console.log('Starting import for', productId)

      nRunning++
      const startTime = Date.now()
      const p = processProduct(productId)
        .then(processSuccess.bind(null, productId))
        .catch(processError.bind(null, productId))
        .finally(() => {
          const endTime = Date.now()
          const latency = endTime - startTime
          const deltaLatency = latency - averageLatency
          nTotal++
          averageLatency += deltaLatency / nTotal
          const threshV = averageLatency * THROTTLE_THRESHOLD
          if (Date.now() - lastBumpTime > THROTTLE_DOWN_TIME_FACTOR * averageLatency && deltaLatency > threshV) {
            lastBumpTime = Date.now()
            concurrency = Math.max(CONCURRENCY_GROWTH_MIN, concurrency - CONCURRENCY_GROWTH_FACTOR)
            console.log('Slowdown detected, reducing concurrency', latency, averageLatency, threshV, concurrency)
          } else if (Date.now() - lastBumpTime > THROTTLE_UP_TIME_FACTOR * averageLatency && deltaLatency < -threshV) {
            lastBumpTime = Date.now()
            concurrency += CONCURRENCY_GROWTH_FACTOR
            console.log('Speedup detected, increasing concurrency', latency, averageLatency, threshV, concurrency)
          }
          nRunning--
        })
      promises.push(p)
    }
    await Promise.all(promises)
    console.log('Finished import')
  } catch (err) {
    console.error('Retrying import due to error', err)
    try {
      await Promise.all(promises)
    } catch (promiseErr) {
      console.error('Could not finish waiting for all promises:', promiseErr)
    }
    await processAllProducts()
  }
}

const main = async () => {
  console.log('Starting search engine import')
  try {
    await knex.initialize()
    await searchEngine.init()
    await processAllProducts()
  } finally {
    await knex.destroy()
  }
}

main().catch(err => console.error(err)).finally(() => process.exit())
