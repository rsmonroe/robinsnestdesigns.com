const { knex, readDB } = require('../db')

const categoryFields = [
  'Category.ID as ID',
  'Category.Category as Category',
  'Category.Comments as Comments',
  'Category.image as image',
]

module.exports = async (categoryId) => {
  if (!categoryId) return Promise.reject(`categoryId is required`)
  const query = knex
    .select(categoryFields)
    .from('Category')
    .where('Category.ID', categoryId)
  // todo fix cache consistency issues here
  return await readDB(query, 'Category')
}
