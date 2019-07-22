const { verifyAuthToken } = require('../../auth')
const searchEngine = require('../../searchEngine')
const updateProduct = require('../../db/Product/updateProduct')
const getProduct = require('../../db/Product/getProduct')
const getCategory = require('../../db/Category/getCategory')
const getSubcategory = require('../../db/Subcategory/getSubcategory')
const reduceProduct = require('../../reducers/reduceProduct')

module.exports = async(obj, { token, productId, productData }, context) => {
  const payload = verifyAuthToken(token)
  // admin only
  if (!payload.a) throw new Error('Not authorized')

  const patch = {
    ItemID: productData.sku,
    ItemName: productData.name,
    ItemPrice: productData.price,
    SalePrice: productData.salePrice,
    Qty: productData.qtyInStock,
    Sale_Start: new Date(Number.parseInt(productData.saleStart)).toISOString(),
    Sale_Stop: new Date(Number.parseInt(productData.saleEnd)).toISOString(),
    Description: productData.description,
    Hyperlinked_Image: productData.hyperlinkedImage,
    Category: productData.categoryId,
    SubCategory: productData.subcategoryId,
    CategoryB: productData.category2,
    SubCategoryB: productData.subcategory2,
    CategoryC: productData.category3,
    SubCategoryC: productData.subcategory3,
    Keywords: productData.keywords,
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

  console.log('updateProduct', productId, patch)
  await updateProduct(productId, patch)
  const [ row ] = await getProduct(productId)
  const product = reduceProduct(row)

  // we have to get extra data
  const getTitle = async (fn) => {
    const [ result ] = await fn()
    return result && result.Category
  }

  if (product.category2)
    product.category2 = await getTitle(() => getCategory(product.category2))
  if (product.category3)
    product.category3 = await getTitle(() => getCategory(product.category3))
  if (product.subcategory2)
    product.subcategory2 = await getTitle(() => getSubcategory(product.subcategory2))
  if (product.subcategory3)
    product.subcategory3 = await getTitle(() => getSubcategory(product.subcategory3))

  await searchEngine.remove(product.id)
  await searchEngine.add(product)
  return product
}
