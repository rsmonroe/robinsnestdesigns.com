const { knex, readDB } = require('../db')
getCustomerInfo(orderId) {
  return readDB(knex.select('*').from('CustomerInfo').where('CustomerID', orderId).first(), 'Order')
}
