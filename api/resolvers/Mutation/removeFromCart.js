const deleteCartItem = require('../../db/Cart/deleteCartItem')
const listCartItems = require('../../db/Cart/listCartItems')
const reduceOrder = require('../../reducers/reduceOrder')

const removeFromCart = async (obj, { cartItemId }, context) => {
  if (!cartItemId) {
    throw new Error('Invalid cartItemId')
  }
  const cartId = await deleteCartItem(cartItemId)
  return reduceOrder(cartId, await listCartItems(cartId))
}

module.exports = removeFromCart
