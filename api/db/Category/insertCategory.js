const { knex, writeDB } = require('../db')

module.exports = ({ title, comments }) => {
  if (!title) return Promise.reject(`title is required`)
  return writeDB(knex('Category').insert({ Category: title, Comments: comments }).returning('ID'), 'Category')
}
