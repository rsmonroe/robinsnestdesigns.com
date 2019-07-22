const { knex, readDB } = require('../db')
module.exports = (orderId) => {
  return readDB(knex.select('*').from('CustomerInfo').where('CustomerID', orderId).first(), 'Order')
}
