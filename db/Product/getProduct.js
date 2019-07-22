const { knex, readDB } = require('../db')
const productFields = require('./productFields')

module.exports = (productId) => {
  if (!productId) return Promise.reject(`productId is required`)
  const query = knex.select(productFields)
  .from('Products')
  .where('Products.ID', productId)
  .leftJoin('Category', 'Products.Category', 'Category.ID')
  .leftJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
  return readDB(query, 'Products')
}
