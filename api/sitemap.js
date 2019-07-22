const stream = require('stream')
const zlib = require('zlib')
const fs = require('fs')
const url = require('url')
const sitemap = require('sitemap')
const slugify = require('slugify')
const { knex, readDB } = require('./db/db')
const listProductsCategories = require('./db/Product/listProductsCategories')

const ProductLinkStr = (props) => (
  `/product/${props.productId}/${slugify('' + props.category)}/${slugify('' + props.subcategory)}/${slugify('' + props.title)}?listref=${props.listName}`
)

const SearchLinkStr = (args) => {
  args = Object.assign({}, args)
  const { categoryId, subcategoryId, pageNo } = args
  delete args.categoryId
  delete args.subcategoryId
  delete args.pageNo

  let queryString = Object.keys(args).filter(key => key && args[key]).map(key => key + '=' + args[key]).join('&')
  if (queryString.length > 0) queryString = '?' + queryString
  let url = '/search'
  if (categoryId) {
    url += '/c/' + categoryId
  }
  if (subcategoryId) {
    url += '/sc/' + subcategoryId
  }
  if (pageNo) {
    url += '/p/' + pageNo
  }
  return url + queryString
}

const makeUrlObj = (url) => {
  return { url }
}

const timeAsyncFn = async (fn, title) => {
  const startTime = Date.now()
  try {
    const retVal = await fn()
    return retVal
  } finally {
    const endTime = Date.now()
    console.log('timeAsyncFn', title, 'took', endTime - startTime, 'ms')
  }
}

const addProductUrls = async (urls) => {
  const productStream = knex.select(
    'Products.ID as ProductID',
    'Products.ItemName as ItemName',
    'Category.Category as Category',
    'Subcategory.Subcategory as Subcategory')
  .from('Products')
  .innerJoin('Category', 'Products.Category', 'Category.ID')
  .innerJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
  .where('Active', 1)
  .stream()

  for await (const productRow of productStream) {
    const props = {
      productId: productRow.ProductID,
      category: productRow.Category,
      subcategory: productRow.Subcategory,
      title: productRow.ItemName,
      listName: 'sitemap',
    }
    urls.add(makeUrlObj(ProductLinkStr(props)))
  }
}

const getCategories = knex.raw(`
  select Category as ID
  from Products
  where Active = 1 and Category is not null
  group by Category
  having count(Products.ID) > 0
  union
  (
  select CategoryB as ID
  from Products
  where Active = 1 and CategoryB is not null
  group by CategoryB
  having count(Products.ID) > 0
  )
  union
  (
  select CategoryC as ID
  from Products
  where Active = 1 and CategoryC is not null
  group by CategoryC
  having count(Products.ID) > 0
  )
`)

const getSubcategories = knex.raw(`
  select t1.ID as ID, Subcategory.Category as Category
  from (
    select Products.SubCategory as ID
    from Products
    where Active = 1 and Products.SubCategory is not null
    group by Products.SubCategory
    having count(Products.ID) > 0
    union
    (
      select SubCategoryB as ID
      from Products
      where Active = 1 and Products.SubCategoryB is not null
      group by SubCategoryB
      having count(Products.ID) > 0
    )
    union (
      select SubCategoryC as ID
      from Products
      where Active = 1 and Products.SubCategoryC is not null
      group by SubCategoryC
      having count(Products.ID) > 0
    )
  ) as t1
  inner join Subcategory on Subcategory.ID = t1.ID
`)

const addSearchUrls = async(urls) => {

  const processCategories = async () => {
    const allCategories = await readDB(getCategories, 'Category')
    allCategories.forEach(category => {
      const categoryArgs = { categoryId: category.ID }
      urls.add(makeUrlObj(SearchLinkStr(categoryArgs)))
    })
  }

  const processSubcategories = async () => {
    const allSubcategories = await readDB(getSubcategories, 'Subcategory')
    allSubcategories.forEach(subcategory => {
      const subcatArgs = { categoryId: subcategory.Category, subcategoryId: subcategory.ID }
      urls.add(makeUrlObj(SearchLinkStr(subcatArgs)))
    })
  }

  await Promise.all([
    timeAsyncFn(processCategories, 'processCategories'),
    timeAsyncFn(processSubcategories, 'processSubcategories'),
  ])
}

const handler = async (hostname) => {
  if (!hostname) throw new Error("Set SITE_URL before continuing")

  const cacheTime = 1000 * 60 * 60 * 24
  //const db = new MyDB()
  //await db.initialize({ context: {} })

  const urls = sitemap.createSitemap({
    hostname,
    cacheTime,
  })

  urls.add(makeUrlObj('/categories'))

  await Promise.all([
    timeAsyncFn(async () => {
      const categories = await listProductsCategories()
      categories.forEach(c => urls.add(makeUrlObj('/category/' + c.ID)))
    }, 'addCategoryUrls'),
    timeAsyncFn(() => addProductUrls(urls), 'addProductUrls'),
    timeAsyncFn(() => addSearchUrls(urls), 'addSearchUrls')
  ])

  return await timeAsyncFn(() => urls.toString(), 'sitemap.createSitemap')
}

const app = require('express')()
app.get('/sitemap', async (req, res) => {
  try {
    await knex.initialize()
    const hostname = process.env.SITE_URL
    if (!hostname) throw new Error('set SITE_URL in env')
    const sitemap = await timeAsyncFn(() => handler(hostname), 'handler')
    const gzipped = zlib.gzipSync(sitemap)
    console.log('sitemap.length', sitemap.length, 'gzipped.length', gzipped.length)
    res.setHeader('content-type', 'application/xml')
    res.setHeader('content-encoding', 'gzip' )
    res.send( gzipped )
  } catch(err) {
    console.error(err)
    res.status(500)
    res.send("Internal server error")
  } finally {
    await knex.destroy()
  }
})

const serverless = require('serverless-http')

module.exports = {}
module.exports.lambda = serverless(app)
