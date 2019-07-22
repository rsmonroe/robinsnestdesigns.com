const { knex, readDB } = require('../db')

module.exports = async (subcategoryId) => {
  if (!subcategoryId) throw new Error('subcategory ID is required')
  return readDB(knex.select(
      'Subcategory.ID as ID',
      'Subcategory.Subcategory as Category',
      'Comments',
      'Subcategory.image as image',
    )
    .from('Subcategory')
    .where('ID', subcategoryId)
    , 'Subcategory')
}
