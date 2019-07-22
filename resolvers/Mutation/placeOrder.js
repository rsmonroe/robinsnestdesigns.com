const paypal = require('@paypal/checkout-server-sdk')
const paypalClient = require('../../paypal')
const sendEmail = require('../../email')

const getOrder = require('../../db/Order/getOrder')
const placeOrder = require('../../db/Order/placeOrder')
const updateProduct = require('../../db/Product/updateProduct')
const getPromo = require('../../db/Promotions/getPromo')
const deletePromo = require('../../db/Promotions/deletePromo')

async function getPaypalOrder(paypalOrderId) {
  let req = new paypal.orders.OrdersGetRequest(paypalOrderId)
  let response = await paypalClient.execute(req)
  if (response.statusCode != 200) {
    throw new Error('Paypal API error ' + response.result)
  }
  const result = response.result
  if (!result) {
    throw new Error('Paypal api returned nothing')
  }
  if (result.intent != "CAPTURE") {
    throw new Error('Invalid order intent')
  }
  if (result.status != "COMPLETED") {
    throw new Error('Order status was not completed')
  }
  if (!result.purchase_units || !Array.isArray(result.purchase_units) || result.purchase_units.length != 1 || !result.purchase_units[0].amount || !result.purchase_units[0].amount.value) {
    throw new Error('Order did not have purchase units')
  }

  return Object.assign({}, result, {
    amount: result.purchase_units[0].amount.value,
  })
}

module.exports = async (obj, { orderId, paypalOrderId, shipping, county, promo }, context) => {
  if (!orderId || !paypalOrderId || !shipping) {
    throw new Error('invalid arguments')
  }

  let order = await getOrder(orderId, shipping, county, promo)

  let {
    placed,
    subtotal,
    tax,
    total,
  } = order
  let realShipping = order.shipping

  if (placed) {
    throw new Error('Order already placed')
  }

  // get paypal order details
  const paypalOrder = await getPaypalOrder(paypalOrderId)

  if (order.total != paypalOrder.amount) {
    throw new Error('paypalOrder does not match order amount -- refund paypal order');
  }

  let {
    name,
    email_address,
    phone,
    address,
  } = paypalOrder.payer

  phone = phone && phone.phone_number

  let {
    address_line_1,
    address_line_2,
    admin_area_2,
    admin_area_1,
    postal_code,
    country_code,
  } = address

  let orderShipping = paypalOrder.purchase_units[0].shipping

  address_line_1 = address_line_1 || orderShipping.address.address_line_1
  address_line_2 = address_line_2 || orderShipping.address.address_line_2
  admin_area_2 = admin_area_2 || orderShipping.address.admin_area_2
  admin_area_1 = admin_area_1 || orderShipping.address.admin_area_1
  postal_code = postal_code || orderShipping.address.postal_code
  country_code = country_code || orderShipping.address.country_code

  let sFirstName = orderShipping.name.full_name.split(' ')[0]
  let sLastName = orderShipping.name.full_name.split(' ')[1]
  let shippingAddress = orderShipping.address
  let shippingAddressLine = shippingAddress.address_line_1 + ' ' + (shippingAddress.address_line_2 || '')
  let shippingCity = shippingAddress.admin_area_2
  let shippingState = shippingAddress.admin_area_1
  let shippingZip = shippingAddress.postal_code
  let shippingCountryCode = shippingAddress.country_code

  const customerInfo = {
    CustomerId: orderId,
    OrderPlaced: 1,
    OrderFilled: 0,
    FirstName: sFirstName,
    LastName: sLastName,
    Phone: phone,
    Email: email_address,
    Address: shippingAddressLine,
    City: shippingCity,
    State: shippingState,
    Zip: shippingZip,
    Country: shippingCountryCode,
    BFirstName: name && name.given_name,
    BLastName: name && name.surname,
    BAddress: address_line_1 + ' ' + (address_line_2 || ''),
    BCity: admin_area_2,
    BState: admin_area_1,
    BZip: postal_code,
    BCountry: country_code,
    BPhone: phone,
    BEmail: email_address,
    Subtotal: subtotal,
    SalesTax: tax,
    Shipping: realShipping,
    Total: total,
    Coupon: promo,
    Discount: order.discount || 0.00,
    CardType: 'Paypal',
    Paypal: 1,
    PaypalComplete: 1,
  }
  await placeOrder(customerInfo)
  order = await getOrder(orderId)

  // post-order actions

  // remove each item bought from stock
  for (let i = 0; i < order.items.length; i++) {
    let lineItem = order.items[i]
    // determine if product is in-stock or not
    if (lineItem.product.qtyInStock && lineItem.product.qtyInStock > 0) {
      let newQty = lineItem.product.qtyInStock - lineItem.qty
      if (newQty < 0) {
        newQty = 0
        // TODO: do something about this?
        console.error('Order No ' + order.id + ' had line item qty ' + lineItem.qty + ' for product id ' + lineItem.product.id + ' but only ' + lineItem.product.qtyInStock + ' were in stock')
      }
      let patch = { Qty: newQty }
      if (lineItem.product.clearance && newQty == 0) {
        patch.Active = 0;
      }
      await updateProduct(lineItem.product.id, patch)
    }
  }

  // remove promo used if single use
  if (promo && Number.parseFloat(order.discount) > 0) {
    const promoObj = await getPromo(promo)
    if (promoObj.SingleUse) {
      await deletePromo(promoObj.ID)
    }
  }

  // send email to admin & user
  const orderLink = process.env.SITE_URL + 'order/' + orderId

  await sendEmail({
    from: "Robin's Nest Designs <postmaster@mg.robinsnestdesigns.com>",
    to: "robin@robinsnestdesigns.com",
    subject: "Order Placed",
    text: 'A new order has been placed.  See: ' + orderLink,
  })

  await sendEmail({
    from: "Robin's Nest Designs <postmaster@mg.robinsnestdesigns.com>",
    to: email_address,
    subject: "Your Order with Robin's Nest Designs",
    template: "order-placed",
    'v:customerFirstName':  (name && name.given_name) || sFirstName,
    'v:orderNo': orderId,
    'v:orderDate': new Date().toLocaleDateString(),
    'v:orderLink': orderLink,
  })

  return order
}
