const { knex, writeDB } = require('../db')
const getProduct = require('../Product/getProduct')
const listCartItems = require('./listCartItems')

module.exports = async (cartId, qty, productId, variant) => {
  const [ product ] = await getProduct(productId)
  if (!product) {
    throw new Error('Product does not exist')
  }
  const q = knex('Cart').insert({
    CustomerID: cartId,
    ProductID: productId,
    Quantity: qty,
    ItemID: product.ItemID,
    ItemName: product.ItemName,
    ItemPrice: product.ItemPrice,
    Subtotal: product.ItemPrice,
    Option: variant || '',
    Handling_Charge: 0,
  })
  await writeDB(q, 'Cart')
  return listCartItems(cartId)
}
