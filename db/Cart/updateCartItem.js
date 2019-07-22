const { knex, writeDB } = require('../db')
const getCartItem = require('./getCartItem')

module.exports = async (cartItemId, qty, variant) => {
  if (!cartItemId) throw new Error('Invalid cart item id')
  const result = await getCartItem(cartItemId)
  if (!result) {
    throw new Error('Invalid cart item id')
  } else if (result.ID != cartItemId) {
    throw new Error('Cart item did not match ID')
  }
  else {
    const q = knex('Cart').where('ID', result.ID).update({ Quantity: qty, Option: variant || '' }).limit(1)
    await writeDB(q, 'Cart')
    return result.CustomerID
  }
}
