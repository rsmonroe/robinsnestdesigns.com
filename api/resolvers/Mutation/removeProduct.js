const { verifyAuthToken } = require('../../auth')
const getProduct = require('../../db/Product/getProduct')
const updateProduct = require('../../db/Product/updateProduct')
const searchEngine = require('../../searchEngine')

module.exports = async (obj, { token, productId }, context) => {
  const payload = verifyAuthToken(token)
  // admin only
  if (!payload.a) throw new Error('Not authorized')
  const [ row ] = await getProduct(productId)
  if (!row) throw new Error('product does not exist')
  await updateProduct(productId, { Active: 0 })
  await searchEngine.remove(productId)
}
