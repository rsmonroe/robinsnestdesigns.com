const { knex, readDB } = require('../db')

module.exports = async (cartItemId) => {
  if (!cartItemId) {
    throw new Error('cartItemId not set')
  }
  return await readDB(knex.select('*').from('Cart').where('ID', cartItemId).first(), 'Cart')
}
