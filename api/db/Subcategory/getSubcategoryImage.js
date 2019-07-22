const { knex, readDB } = require('../db')

module.exports = async (subcategoryId) => {
  if (!subcategoryId) return Promise.reject(`subcategoryId is required`)
  const query = knex.select('image').from('Subcategory').where('ID', subcategoryId)
  const [ { image } ] = await readDB(query, 'Subcategory')
  return image
}
