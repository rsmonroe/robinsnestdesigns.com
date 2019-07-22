const { knex, readDB } = require('../db')
const buildSearchQuery = require('./buildSearchQuery')
const validateArgs = require('./validateArgs')
const categoryFields = require('../Category/categoryFields')

module.exports = (args) => {
  args = validateArgs(args)
  const searchQueryNoAs = buildSearchQuery(knex, args)
  const categoryQuery = knex.select(categoryFields)
    .from('Category')
    .orderBy('Category', 'ASC')
    .whereIn('Category.ID',
      knex.select('Category')
        .from(searchQueryNoAs.clone().as('Search1'))
        .innerJoin('Products', 'Products.ID', 'Search1.ID')
        .union(
          knex.select('CategoryB as Category')
            .from(searchQueryNoAs.clone().as('Search2'))
            .innerJoin('Products', 'Products.ID', 'Search2.ID')
        )
        .union(
          knex.select('CategoryC as Category')
            .from(searchQueryNoAs.clone().as('Search3'))
            .innerJoin('Products', 'Products.ID', 'Search3.ID')
        )
    )
    console.log('listProductsCategories', categoryQuery.toString())
    return readDB(categoryQuery, 'Products')
}
