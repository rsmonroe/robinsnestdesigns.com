const { verifyAuthToken } = require('../../auth')
const updateUser = require('../../db/User/updateUser')
const findUserById = require('../../db/User/findUserById')
const reduceUser = require('../../reducers/reduceUser')

module.exports = async (obj, { token, user }, context) => {
  const payload = verifyAuthToken(token)
  const uid = payload.uid
  await updateUser(uid, {
    FirstName: user.firstName,
    LastName: user.lastName,
    Address: user.address,
    City: user.city,
    State: user.state,
    Zip: user.zip,
    Country: user.country,
    Phone: user.phone,
  })
  const userRow = await findUserById(uid)
  if (!userRow) throw new Error('user does not exist')
  const output = reduceUser(userRow)
  return output
}
