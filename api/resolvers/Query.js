const {
  verifyAuthToken,
  getUserFromToken,
} = require('../auth')

const getOrder = require('../db/Order/getOrder')
const getCategory = require('../db/Category/getCategory')
const listCategories = require('../db/Category/listCategories')
const listSubcategories = require('../db/Subcategory/listSubcategories')
const getProduct = require('../db/Product/getProduct')
const getWishList = require('../db/WishList/getWishList')
const listPromos = require('../db/Promotions/listPromos')

const reduceProduct = require('../reducers/reduceProduct')
const reduceWishList = require('../reducers/reduceWishList')
const reduceCategory = require('../reducers/reduceCategory')
const reducePromo = require('../reducers/reducePromo')
const reduceAllCategories = require('../reducers/reduceAllCategories')

module.exports = {
  siteinfo: (obj, args, context) => { return {} },
  category: (obj, args, context) => getCategory(args.categoryId).then(x => reduceCategory(x[0])),
  allCategories: (obj, args, context) => listCategories().then(reduceAllCategories),
  allSubcategories: (obj, args, context) => listSubcategories(args.categoryId).then(reduceAllCategories),
  product: (obj, args, context) => getProduct(args.productId).then(x => {
    if (!x || x.length == 0) return Promise.reject(new Error('Product does not exist'))
    return reduceProduct(x[0])
  }),
  allProducts: (obj, args, context) => { return { args } },
  cart: (obj, args, context) => getOrder(args.orderId, args.shipping, args.county, args.promo),
  user: async (obj, { token }, context) => {
    const user = await getUserFromToken(token)
    return user
  },
  wishlist: async (obj, { token }, context) => {
    const { uid } = verifyAuthToken(token)
    const wlRows = await getWishList(uid)
    const wishList = reduceWishList(wlRows)
    return wishList
  },
  allPromos: async (obj, { token }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    const promos = await listPromos()
    return promos.map(reducePromo)
  },
  similarKeywords: async (obj, { keyword }, context) => {
    throw new Error('Not implemented')
  },
  // isInWishlist: (obj, { token, productId }, context) => context.dataSources.db.isInWishlist(verifyAuthToken(token).uid, productId),
}
