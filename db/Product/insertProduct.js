const { knex, writeDB } = require('../db')
module.exports = (productData) => {
  if (!productData) return Promise.reject(`productData is required`)
  return writeDB(knex('Products').insert(productData).returning('ID'), 'Products')
}
