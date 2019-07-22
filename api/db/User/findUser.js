const { knex, readDB } = require('../db')

module.exports = (email) => {
  return readDB(knex.select('*')
    .from('CustomerAccounts')
    .where('Email', email)
    .first(), 'User')
}
