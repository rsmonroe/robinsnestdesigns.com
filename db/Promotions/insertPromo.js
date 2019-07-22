const { knex, writeDB } = require('../db')

module.exports = async (row) => {
  if (!row || !row.Starts || !row.Ends || !row.Coupon) {
    throw new Error("promo missing required fields")
  }
  return writeDB(knex('Promotions').insert(row).returning('ID'), 'Promotions')
}
