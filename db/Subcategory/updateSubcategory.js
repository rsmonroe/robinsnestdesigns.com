const { knex, writeDB } = require(.'./db')

module.exports = async (subcategoryId, { categoryId, title, comments, image }) => {
  if (!subcategoryId) throw new Error('subcategory ID is required')
  return await writeDB(
    knex('Subcategory')
      .where('ID', subcategoryId)
      .limit(1)
      .update({ Category: categoryId, Subcategory: title, Comments: comments, image })
      , 'Subcategory'
  )
}
