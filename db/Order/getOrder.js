const reduceOrder = require('../../reducers/reduceOrder')
const listCartItems = require('../WishList/listCartItems')
const getPromo = require('../Promotions/getPromo')
const getCustomerInfo = require('./getCustomerInfo')

module.exports = async function getOrder(orderId, shipping, county, coupon_code) {
  const rows = await listCartItems(orderId)
  let promo = null
  if (coupon_code)
    promo = await getPromo(coupon_code)

  const order = reduceOrder(orderId, rows, shipping, county, promo)
  const cInfo = await getCustomerInfo(orderId)
  if (cInfo) {
    order.placed = true
    order.subtotal = cInfo.Subtotal
    order.tax = cInfo.SalesTax
    order.shipping = cInfo.Shipping
    order.total = cInfo.Total
    order.customerInfo = cInfo
  }
  return order
}
