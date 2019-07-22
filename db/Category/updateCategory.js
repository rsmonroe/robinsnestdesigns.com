const { knex, writeDB } = require('../db')
module.exports = async (categoryId, { title, comments, image }) => {
  if (!categoryId) return Promise.reject(`categoryId is required`)
  return await writeDB(knex('Category').where('ID', categoryId).limit(1).update({ Category: title, Comments: comments, image }), 'Category')
}
