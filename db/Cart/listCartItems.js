const { knex, readDB } = require('../db')
const cartItemFields = [
  'Cart.ID as CartItemId',
  'CustomerID as OrderNo',
  'Quantity',
  'Option',
]
const productFields = require('../Product/productFields')

module.exports = (cartId) => readDB(
  knex.select(cartItemFields.concat(productFields))
    .from('Cart')
    .leftJoin('Products', 'Products.ID', 'Cart.ProductID')
    .leftJoin('Category', 'Products.Category', 'Category.ID')
    .leftJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
    .where('CustomerID', cartId), 'Cart'
)
