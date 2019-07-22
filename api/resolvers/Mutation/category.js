const { verifyAuthToken } = require('../../auth')
const insertCategory = require('../../db/Category/insertCategory')
const getCategory = require('../../db/Category/getCategory')
const updateCategory = require('../../db/Category/updateCategory')
const reduceCategory = require('../../reducers/reduceCategory')

module.exports = {
  addCategory: async(obj, { token, category }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    const [ categoryId ] = await insertCategory(category)
    const [ row ] = await getCategory(categoryId)
    return reduceCategory(row)
  },
  updateCategory: async(obj, { token, categoryId, category }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    await updateCategory(categoryId, category)
    const [ row ] = await getCategory(categoryId)
    return reduceCategory(row)
    // todo update searchEngine
  },
}
