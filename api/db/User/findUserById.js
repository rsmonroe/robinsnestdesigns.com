const { knex, readDB } = require('../db')

module.exports = (uid) => {
  if (!uid) throw new Error('uid is required')
  return readDB(knex.select('*')
    .from('CustomerAccounts')
    .where('ID', uid)
    .first(), 'User')
}
