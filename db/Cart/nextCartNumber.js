const { knex, readDB } = require('../db')

module.exports = async () => {
  const r = await readDB(knex.select('CustomerID').from('Cart').orderBy('CustomerID', 'DESC').first(), 'Cart')
  return r && r.CustomerID && (Number.parseInt(r.CustomerID) + 1)
}
