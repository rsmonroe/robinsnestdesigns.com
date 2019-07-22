const { knex, readDB } = require('../db')
module.exports = () => {
  const query = knex.select('*').from('TaxTables')
  return readDB(query, 'TaxTables')
}
