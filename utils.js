const isOnSale = (obj) => obj.salePrice
  && obj.saleStart
  && obj.saleEnd
  && obj.salePrice > 0
  && IsWithinDateRange(Date.now(), ParseDate(obj.saleStart), ParseDate(obj.saleEnd)) || false

const IsWithinDateRange = (timestamp, rangeStart, rangeEnd) => {
  return timestamp > rangeStart && timestamp < rangeEnd
}

const ParseDate = (dateStr) => {
  const retVal = Number.parseInt(dateStr)
  return Number.isNaN(retVal) ? Date.parse(dateStr) : retVal
}

const listProductsTotal = require('./db/Product/listProductsTotal')
const listProducts = require('./db/Product/listProducts')
const reduceProduct = require('./reducers/reduceProduct')

const getImage = async (storeGetFn, storeSetFn, listProductsArgs) => {
  let image = await storeGetFn()
  if (image) return image
  const [ { nRecords } ] = await listProductsTotal(listProductsArgs)
  for (let skip = 0; skip < nRecords; skip += 50) {
    const products = await listProducts(Object.assign({ skip }, listProductsArgs))
    const product = products.map(reduceProduct).filter(p => p && p.hyperlinkedImage)[0]
    image = product && product.hyperlinkedImage
    if (image) {
      await storeSetFn(image)
      return image
    }
  }
  return null
}

module.exports = {
  isOnSale,
  IsWithinDateRange,
  ParseDate,
  getImage,
}
