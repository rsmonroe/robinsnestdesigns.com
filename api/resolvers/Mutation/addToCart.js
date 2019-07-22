const nextCartNumber = require('../../db/Cart/nextCartNumber')
const insertCartItem = require('../../db/Cart/insertCartItem')
const getOrder = require('../../db/Order/getOrder')
const getProduct = require('../../db/Product/getProduct')

const reduceProduct = require('../../reducers/reduceProduct')
const reduceOrder = require('../../reducers/reduceOrder')

const addToCart = async (obj, args, context) => {
  let cartId = args.orderId
  const productId = args.productId
  const qty = args.qty

  if (qty < 1) {
    throw new Error('Invalid Quantity')
  }

  if (!cartId) {
    cartId = await nextCartNumber()
  }

  let order = await getOrder(cartId)
  if (order.placed)
    throw new Error('Order is not modifiable')

  let [ product ] = await getProduct(productId)
  if (!product) throw new Error('Product does not exist')
  product = reduceProduct(product)

  let variant = args.variant
  if (variant) {
    variant = product.productVariants.filter((x) => x.id == variant)[0]
    if (!variant) throw new Error('Invalid variant id')
    variant = variant.text
  }
  const rows = await insertCartItem(cartId, qty, productId, variant)
  order = await reduceOrder(cartId, rows)
  return order
}

module.exports = addToCart
