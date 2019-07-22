const uuidv4 = require('uuid/v4')

const { verifyAuthToken } = require('../../auth')
const signS3Url = require('../../signS3Url')

module.exports = async (obj, { token, fileName, fileType }, context) => {
  const payload = verifyAuthToken(token)
  // admin only
  if (!payload.a) throw new Error('Not authorized')
  const parts = fileName.split('.')
  if (parts.length < 2) throw new Error('no file extension detected')
  fileName = uuidv4() + '.' + parts[parts.length-1]
  return await signS3Url(fileName, fileType)
}
