const { knex, readDB } = require('../db')
const validateArgs = require('./validateArgs')
const buildSearchQuery = require('./buildSearchQuery')

module.exports = (args) => {
  args = validateArgs(args)
  const searchQueryNoAs = buildSearchQuery(knex, args)
  const subcategoryQuery = knex.select(
    'Subcategory.ID as ID',
    'Subcategory.Subcategory as Category',
    'Comments',
    'Subcategory.image as image'
  )
  .from('Subcategory')
  .where('Subcategory.Category', '=', args.categoryId)
  .orderBy('Subcategory.Subcategory', 'ASC')
  .whereIn('Subcategory.ID',
    knex.select('Subcategory')
      .from(searchQueryNoAs.clone().as('Search1'))
      .innerJoin('Products', 'Products.ID', 'Search1.ID')
      .union(
        knex.select('SubcategoryB as Subcategory')
          .from(searchQueryNoAs.clone().as('Search2'))
          .innerJoin('Products', 'Products.ID', 'Search2.ID')
      )
      .union(
        knex.select('SubcategoryC as Subcategory')
          .from(searchQueryNoAs.clone().as('Search3'))
          .innerJoin('Products', 'Products.ID', 'Search3.ID')
      )
  )
  console.log('listProductsSubcategories', subcategoryQuery.toString())
  return readDB(subcategoryQuery, 'Products')
}
