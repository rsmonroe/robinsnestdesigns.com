const { knex, readDB } = require('../db')
const buildSearchQuery = require('./buildSearchQuery')
const validateArgs = require('./validateArgs')
const productFields = require('./productFields')

module.exports = (args) => {
  args = validateArgs(args)

  const searchQueryNoAs = buildSearchQuery(knex, args)
  const searchQuery = searchQueryNoAs.as('Search')

  let dataQuery =  knex.select(productFields)
    .from(searchQuery.clone())
    .innerJoin('Products', 'Search.ID', 'Products.ID')
    .innerJoin('Category', 'Products.Category', 'Category.ID')
    .innerJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
    .offset(args.skip)
    .limit(args.limit)

  if (args.sort == 'alpha') {
    dataQuery = dataQuery.orderBy('ItemName', 'asc')
  }
  else if (args.sort == 'mostRecent') {
    dataQuery = dataQuery.orderBy('Products.ID', 'desc')
  }
  else if (args.sort == 'priceAsc') {
    dataQuery = dataQuery.orderBy('EffectivePrice', 'asc')
  }
  else if (args.sort == 'priceDesc') {
    dataQuery = dataQuery.orderBy('EffectivePrice', 'desc')
  }
  else if (args.sort == 'random') {
    dataQuery = dataQuery.orderByRaw(process.env.SQL_ENGINE == 'mssql' ? 'NEWID()' : process.env.SQL_ENGINE == 'mysql' ? 'RAND()' : 'RANDOM()')
  }
  // relevance by default
  else {
    dataQuery = dataQuery
      .orderBy('relevance', 'desc')
      .orderBy('Products.ID', 'desc')
  }
  console.log('listProducts', dataQuery.toString())
  return readDB(dataQuery, 'Products')
}
