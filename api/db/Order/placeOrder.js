const { knex, writeDB } = require('../db')
module.exports = (orderData) => writeDB(knex('CustomerInfo')
  .insert(orderData)
  .returning('ID'), 'Order')
