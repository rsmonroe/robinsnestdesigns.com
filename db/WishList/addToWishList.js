const isInWishlist = require('./isInWishlist')
const { knex, writeDB } = require('../db')

module.exports = async (uid, productId) => {
  if (!uid) throw new Error('uid is required')
  if (!productId) throw new Error('productId is required')
  // TODO: fix this race condition
  console.log('addToWishList enter')
  if (await isInWishlist(uid, productId)) return
  console.log('addToWishList writeDB')
  return await writeDB(
    knex('WishList')
      .insert({ AccountID: uid, ItemID: productId })
    , 'WishList'
  )
}
