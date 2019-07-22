const { knex, readDB } = require('../db')

module.exports = async (uid, productId) => {
  if (!uid) throw new Error('uid is required')
  if (!productId) throw new Error('productId is required')
  const result = await readDB(knex.select('ID')
    .from('WishList')
    .where('AccountID', uid)
    .where('ItemID', productId)
    .first(), 'WishList')
  return !!result
}
