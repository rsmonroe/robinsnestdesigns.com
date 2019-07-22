const { knex, writeDB } = require('../db')
module.exports = (productId, productData) => {
  if (!productId || !productData) return Promise.reject(`productId and productData are required`)
  return writeDB(knex('Products')
    .where('Products.ID', productId)
    .limit(1)
    .update(productData), 'Products')
}
