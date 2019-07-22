const { knex, readDB } = require('../db')
module.exports = (categoryId) => {
  let query = knex
    .select('Subcategory.ID as ID', 'Subcategory.Subcategory as Category', 'Comments')
    .from('Subcategory')
    .orderBy('Subcategory.Subcategory', 'ASC')
  if (categoryId)
    query = query.where('Subcategory.Category', '=', categoryId)
  return readDB(query, 'Subcategory')
}
