const { knex, readDB } = require('../db')

module.exports = async (categoryId) => {
  if (!categoryId) return Promise.reject(`categoryId is required`)
  const query = knex.select('image').from('Category').where('ID', categoryId)
  const [ { image } ] = await readDB(query, 'Category')
  return image
}
