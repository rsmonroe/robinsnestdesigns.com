const { isOnSale } = require('../utils')

module.exports = {
  isOnSale: (obj, args, context) => isOnSale(obj),
}
