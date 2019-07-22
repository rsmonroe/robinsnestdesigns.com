const { verifyAuthToken } = require('../../auth')
const insertSubcategory = require('../../db/Subcategory/insertSubcategory')
const getSubcategory = require('../../db/Subcategory/getSubcategory')
const updateSubcategory = require('../../db/Subcategory/updateSubcategory')
const reduceCategory = require('../../reducers/reduceCategory')

module.exports = {
  addSubcategory: async (obj, { token, subcategory }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    const [ categoryId ] = await insertSubcategory(subcategory)
    const [ row ] = await getSubcategory(categoryId)
    return reduceCategory(row)
  },
  updateSubcategory: async( obj, { token, subcategoryId, subcategory }, context) => {
    const payload = verifyAuthToken(token)
    // admin only
    if (!payload.a) throw new Error('Not authorized')
    await updateSubcategory(subcategoryId, subcategory)
    const [ row ] = await getSubcategory(subcategoryId)
    return reduceCategory(row)
    // todo update searchEngine
  },
}
