const url = require('url')
const knex = require('./knex')

const redirectUrls = [
  {
    src: /category_results\.cfm\?Category=(\d+)/,
    dest: (_, categoryId) => `/search/c/${categoryId}`,
  },
  {
    src: /results\.cfm\?SubCategory=(\d+)/,
    dest: async (_, subcategoryId) => {
      const category = await knex
        .select('Category as categoryId')
        .from('Subcategory')
        .where('ID', subcategoryId)
        .first()
      if (!category) {
        return `/categories`
      } else {
        const { categoryId } = category
        return `/search/c/${categoryId}/sc/${subcategoryId}`
      }
    }
  },
  {
    src: /Results\.cfm\?KeyWords=(.+)/,
    dest: (_, searchPhrase) => `/search/?searchPhrase=${searchPhrase}`
  },
  {
    src: /detail.cfm\?ID=(\d+)/,
    dest: (_, productId) => `/product/${productId}`
  },
]

const handler = async (req, res) => {
  const requestPath = req.params.requestPath || ""
  const queryStr = url.parse(req.url).href.split('?')[1] || ""
  const requestUrl = requestPath + (queryStr ? ('?' + queryStr) : '')
  console.log('redirecting', requestUrl)
  for (const cfg of redirectUrls) {
    const match = cfg.src.exec(requestUrl)
    if (match) {
      const redirectPath = url.resolve(process.env.SITE_URL, await Promise.resolve(cfg.dest.apply(null, match)))
      res.setHeader('Location', redirectPath)
      res.status(301)
      res.send('Moved to: ' + redirectPath)
      return
    }
  }
  res.status(404)
  res.send('Not found')
}

const app = require('express')()
app.get('/redirect/:requestPath', handler)
const serverless = require('serverless-http')
module.exports = {}
module.exports.lambda = serverless(app)
