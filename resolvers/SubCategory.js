const { getImage } = require('../utils')

module.exports = {
  image: async (obj, args, { dataSources: { db } }) => getImage(
    db,
    () =>  db.getSubcategoryImage(obj.id),
    (image) => db.updateSubcategory(obj.id, { image, }),
    {
      subcategoryId: obj.id,
      sortOrder: 'mostRecent',
    }
  ),
}
