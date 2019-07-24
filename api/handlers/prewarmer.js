module.exports.lambda = async (evt, context) => {
  if (!process.env.PAGE_URL)
    throw new Error('prewarmer.js requires you set PAGE_URL to a valid URL')
  await fetch(process.env.PAGE_URL)
}
