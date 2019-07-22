const { knex, readDB } = require('../db')

const categoryFields = [
  'Category.ID as ID',
  'Category.Category as Category',
  'Category.Comments as Comments',
  'Category.image as image',
]

module.exports = () => readDB(knex.select(categoryFields)
  .from('Category')
  .where('Category.Category', 'like', '%-%')
  .orderBy('Category.Category', 'ASC')
  , 'Category')
