const { knex, writeDB } = require('../db')
module.exports = (uid, patch) => {
  if (!uid) throw new Error('uid is required')
  return writeDB(knex('CustomerAccounts')
    .where('ID', uid)
    .limit(1)
    .update(patch), 'User')
}
