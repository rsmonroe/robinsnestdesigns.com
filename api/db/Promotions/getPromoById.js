const { knex, readDB } = require('../db')

module.exports = async (id) => {
  if (!id)
    throw new Error('id required')
  else
    return await readDB(knex.select('*').from('Promotions')
      .where('ID', id)
      .first(), 'Promotions')
}
