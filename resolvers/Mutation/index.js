const {
  register,
  signin,
} = require('../../auth')

const requestSignedUrl = require('./requestSignedUrl')
const addToCart = require('./addToCart')
const updateCartItem = require('./updateCartItem')
const removeFromCart = require('./removeFromCart')
const placeOrder = require('./placeOrder')
const updateUser = require('./updateUser')
const createProduct = require('./createProduct')
const updateProduct = require('./updateProduct')
const removeProduct = require('./removeProduct')

const { addPromo, updatePromo, removePromo } = require('./promos')
const { addToWishList, removeFromWishList } = require('./wishlist')
const { addCategory, updateCategory } = require('./category')
const { addSubcategory, updateSubcategory } = require('./subcategory')

module.exports = {
  signin,
  register,
  addToCart,
  updateCartItem,
  removeFromCart,
  placeOrder,
  updateUser,
  createProduct,
  updateProduct,
  requestSignedUrl,
  addToWishList,
  removeFromWishList,
  addCategory,
  updateCategory,
  addSubcategory,
  updateSubcategory,
  addPromo,
  updatePromo,
  removePromo,
  removeProduct,
}
