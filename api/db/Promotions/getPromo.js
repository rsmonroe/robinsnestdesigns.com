const { knex, readDB } = require('../db')

module.exports = async (coupon_code) => {
  if (!coupon_code)
    throw new Error('coupon_code required')
  else
    return await readDB(knex.select('*').from('Promotions')
      .where('Coupon', coupon_code)
      .where('Starts', '<=', new Date())
      .where('Ends', '>=', new Date())
      .first(), 'Promotions')
}
