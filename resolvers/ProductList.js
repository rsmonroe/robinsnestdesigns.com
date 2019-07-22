const listProductsTotal = require('../db/Product/listProductsTotal')
const listProducts = require('../db/Product/listProducts')
const listProductsCategories = require('../db/Product/listProductsCategories')
const listProductsSubcategories = require('../db/Product/listProductsSubcategories')

const reduceAllCategories = require('../reducers/reduceAllCategories')
const reduceProduct = require('../reducers/reduceProduct')

module.exports = {
  total: async (obj, args, context) => {
    const [ { nRecords } ] = await listProductsTotal(obj.args)
    return nRecords || 0
  },
  records: async (obj, args, context) => {
    const products = await listProducts(obj.args)
    return products.map(reduceProduct)
  },
  categories: async (obj, args, context) => {
    const categories = await listProductsCategories(obj.args)
    const categoriesObj = reduceAllCategories(categories)
    return categoriesObj
  },
  subcategories: async (obj, args, context) => {
    if (obj.args.categoryId) {
      const subcategories = await listProductsSubcategories(obj.args)
      return reduceAllCategories(subcategories)
    }
  },
}
