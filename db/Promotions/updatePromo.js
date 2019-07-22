const { knex, writeDB } = require('../db')

module.exports = async (promoId, patch) => {
  if (!promoId) throw new Error('promo id is required')
  return writeDB(knex('Promotions').where('ID', promoId).update(patch), 'Promotions')
}
