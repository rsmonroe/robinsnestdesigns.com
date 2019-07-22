const { knex, readDB } = require('../db')
const getPromoById = require('./getPromoById')

module.exports = async (promoId) => {
  const promo = await getPromoById(promoId)
  if (!promo)
    throw new Error("promo does not exist")
  await writeDB(knex('Promotions').where('ID', promoId).limit(1).del(), 'Promotions')
}
