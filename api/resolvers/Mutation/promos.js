const { verifyAuthToken } = require('../../auth')
const insertPromo = require('../../db/Promotions/insertPromo')
const updatePromo = require('../../db/Promotions/updatePromo')
const deletePromo = require('../../db/Promotions/deletePromo')
const getPromoById = require('../../db/Promotions/getPromoById')
const reducePromo = require('../../reducers/reducePromo')

module.exports = {
  addPromo: async (obj, { token, promo }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    const patch = {
      Coupon: promo.coupon,
      Starts: promo.starts,
      Ends: promo.ends,
      PriceBreak: promo.requiresTotal,
      MoneyOff: promo.moneyOff,
      PercentageOff: promo.percentageOff,
      FreeShipping: promo.freeShipping,
    }
    const [ id ] = await insertPromo(patch)
    const row = await getPromoById(id)
    return reducePromo(row)
  },
  updatePromo: async (obj, { token, promoId, promo }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    const patch = {
      Coupon: promo.coupon,
      Starts: promo.starts,
      Ends: promo.ends,
      PriceBreak: promo.requiresTotal,
      MoneyOff: promo.moneyOff,
      PercentageOff: promo.percentageOff,
      FreeShipping: promo.freeShipping,
    }
    await updatePromo(promoId, patch)
    const row = await getPromoById(id)
    return reducePromo(row)
  },
  removePromo: async (obj, { token, promoId }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    await deletePromo(promoId)
  },
}
