const { knex, readDB } = require('../db')
const buildSearchQuery = require('./buildSearchQuery')
const validateArgs = require('./validateArgs')

module.exports = (args) => {
  args = validateArgs(args)
  const searchQueryNoAs = buildSearchQuery(knex, args)
  const searchQuery = searchQueryNoAs.as('Search')
  const countQuery = knex.count('* as nRecords').from(searchQuery)
  // console.log('listProductsTotal', countQuery.toString())
  return readDB(countQuery, 'Products')
}
