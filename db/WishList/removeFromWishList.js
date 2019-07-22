const { knex, writeDB } = require('../db')

module.exports = async (uid, productId) => {
  if (!uid) throw new Error('uid is required')
  if (!productId) throw new Error('productId is required')
  await writeDB(
    knex('WishList')
      .where({ AccountID: uid, ItemID: productId })
      .limit(1)
      .del(),
    'WishList'
  )
}
