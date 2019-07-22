const getCartItem = require('../../db/Cart/getCartItem')
const getProduct = require('../../db/Product/getProduct')
const reduceProduct = require('../../reducers/reduceProduct')
const updateCartItem = require('../../db/Cart/updateCartItem')
const listCartItems = require('../../db/Cart/listCartItems')
const reduceOrder = require('../../reducers/reduceOrder')

module.exports = async (obj, { cartItemId, qty, variant }, context) => {
    if (!cartItemId || !qty || qty < 1) {
      throw new Error('Invalid arguments');
    } else {
      const cartItem = await getCartItem(cartItemId)
      if (!cartItem) throw new Error('Cart item not found')
      const cartId = cartItem.CustomerID
      if (variant) {
        const productId = cartItem.ProductID
        let [ product ] = await getProduct(productId)
        if (!product) throw new Error('Product does not exist')
        product = reduceProduct(product)
        let variantId = variant
        variant = product.productVariants.filter(x => x.id == variantId).map(x => x.text)[0]
        if (!variant) throw new Error('Invalid variant id')
      }
      await updateCartItem(cartItemId, qty, variant)
      const rows = await listCartItems(cartId)
      return reduceOrder(cartId, rows)
    }
}
