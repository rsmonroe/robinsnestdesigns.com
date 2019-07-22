const { verifyAuthToken } = require('../../auth')
const searchEngine = require('../../searchEngine')
const insertProduct = require('../../db/Product/insertProduct')
const getProduct = require('../../db/Product/getProduct')
const getCategory = require('../../db/Category/getCategory')
const getSubcategory = require('../../db/Subcategory/getSubcategory')
const reduceProduct = require('../../reducers/reduceProduct')

module.exports = async(obj, { token, productData }, context) => {
  const payload = verifyAuthToken(token)
  // admin only
  if (!payload.a) throw new Error('Not authorized')

  const patch = {
    Active: true,
    ItemID: productData.sku,
    ItemName: productData.name,
    ItemPrice: productData.price,
    SalePrice: productData.salePrice,
    Qty: productData.qtyInStock,
    Sale_Start: productData.saleStart && new Date(Number.parseInt(productData.saleStart)).toISOString(),
    Sale_Stop: productData.saleEnd && new Date(Number.parseInt(productData.saleEnd)).toISOString(),
    Description: productData.description || null,
    Hyperlinked_Image: productData.hyperlinkedImage || null,
    Category: productData.categoryId,
    SubCategory: productData.subcategoryId,
    CategoryB: productData.category2 || null,
    SubCategoryB: productData.subcategory2 || null,
    CategoryC: productData.category3 || null,
    SubCategoryC: productData.subcategory3 | null,
    Keywords: productData.keywords || null,
    Added: new Date(),
  }

  const fields = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
  fields.forEach(pos => {
    const priceFieldName = 'Price' + pos
    const textFieldName = 'Option' + pos
    let variant = {
      price: 0.00,
      text: '',
    }
    if (productData.productVariants) {
      variant = productData.productVariants[pos-1] || variant
    }
    patch[priceFieldName] = variant.price
    patch[textFieldName] = variant.text
  })

  console.log('insertProduct', patch)
  const result = await insertProduct(patch)
  console.log('insertProduct result',result)
  const [ resultId ] = result
  const [ row ] = await getProduct(resultId)
  const product = reduceProduct(row)

  // we have to get extra data
  const getTitle = async (fn) => {
    const [ result ] = await fn()
    return result && result.Category
  }

  if (product.category2)
    product.category2 = await getTitle(() => context.dataSources.db.getCategory(product.category2))
  if (product.category3)
    product.category3 = await getTitle(() => context.dataSources.db.getCategory(product.category3))
  if (product.subcategory2)
    product.subcategory2 = await getTitle(() => context.dataSources.db.getSubcategory(product.subcategory2))
  if (product.subcategory3)
    product.subcategory3 = await getTitle(() => context.dataSources.db.getSubcategory(product.subcategory3))

  await searchEngine.add(product)
  return product
}
