const { getImage } = require('../utils')
const getSubcategoryImage = require('../db/Subcategory/getSubcategoryImage')
const updateSubcategory = require('../db/Subcategory/updateSubcategory')

module.exports = {
  image: async (obj, args, context) => getImage(
    () =>  getSubcategoryImage(obj.id),
    (image) => updateSubcategory(obj.id, { image, }),
    {
      subcategoryId: obj.id,
      sortOrder: 'mostRecent',
    }
  ),
}
