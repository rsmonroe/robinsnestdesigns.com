const { knex, readDB } = require('../db')

const categoryFields = require('./categoryFields')

module.exports = () => readDB(knex.select(categoryFields)
  .from('Category')
  .where('Category.Category', 'like', '%-%')
  .orderBy('Category.Category', 'ASC')
  , 'Category')
