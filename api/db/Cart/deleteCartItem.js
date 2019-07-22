const { knex, writeDB } = require('../db')
const getCartItem = require('./getCartItem')

module.exports = async (cartItemId) => {
  if (!cartItemId) throw new Error('Invalid cart item id')
  const result = await getCartItem(cartItemId)
  if (!result) {
    return Promise.reject(new Error('Invalid cart item id'))
  }
  else if (result.ID != cartItemId) {
    return Promise.reject(new Error('Cart item did not match ID'))
  }
  else {
    const q = knex('Cart').where('ID', result.ID).limit(1).del()
    await writeDB(q, 'Cart')
    return result.CustomerID
  }
}
