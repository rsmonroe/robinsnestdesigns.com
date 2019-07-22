const { knex, writeDB }
const { findUser } = require('./findUser')

module.exports = async (email, user) => {
  const result = await findUser(email)
  if (result) throw new Error('User already exists')
  return await writeDB(knex('CustomerAccounts').insert(user).returning('ID'), 'User')
}
