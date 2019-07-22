const { knex, writeDB } = require('../db')

module.exports = ({ categoryId, title, comments }) => {
  if (!title) throw new Error('title is required')
  if (!categoryId) throw new Error('categoryId is required')
  return writeDB(
    knex('Subcategory')
    .insert({ Category: categoryId, Subcategory: title, Comments: comments })
    .returning('ID')
    , 'Subcategory')
}
