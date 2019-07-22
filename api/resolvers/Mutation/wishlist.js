const { verifyAuthToken } = require('../../auth')
const addToWishList = require('../../db/WishList/addToWishList')
const removeFromWishList = require('../../db/WishList/removeFromWishList')

module.exports = {
  addToWishList: (obj, { token, productId }, context) => addToWishList(verifyAuthToken(token).uid, productId),
  removeFromWishList: (obj, { token, productId }, context) => removeFromWishList(verifyAuthToken(token).uid, productId),
}
