const { knex, readDB } = require('../db')
const productFields = require('../Product/productFields')

module.exports = async (uid) => {
  if (!uid) throw new Error('uid is required')
  return await readDB(
    knex.select([
      'WishList.Date as AddedDate',
      'WishList.ID as WishListID'
    ].concat(productFields))
    .from('WishList')
    .where('AccountID', uid)
    .innerJoin('Products', 'WishList.ItemID', 'Products.ID')
    .innerJoin('Category', 'Products.Category', 'Category.ID')
    .innerJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
    , 'WishList'
  )
}
