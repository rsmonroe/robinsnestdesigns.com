const searchEngine = require('../../searchEngine')
const { knex } = require('../db')

/* produces SQL like:
(  (Price1 > 0 AND Price1 $operator $value)
 OR (
       SalePrice > 0
   AND Sale_Start <= CURRENT_TIMESTAMP
   AND Sale_Stop >= CURRENT_TIMESTAMP
   AND SalePrice $operator $value
 )
 OR (ItemPrice $operator $value)
)
 */
const WherePrice = (query, operator, value) => {
  return query.where(builder => builder
    .orWhere(builder => builder
      .where('Price1', '>', 0)
      .where('Price1', operator, value)
    )
    .orWhere(builder => builder
      .where('SalePrice', '>', 0)
      .whereRaw('Products.Sale_Start <= CURRENT_TIMESTAMP')
      .whereRaw('Products.Sale_Stop >= CURRENT_TIMESTAMP')
      .where('SalePrice', operator, value)
    )
    .orWhere(builder => builder
      .where('ItemPrice', operator, value)
    )
  )
}

/**
  Creates a query s.t. it SELECT's productFields + relevance (semantic meaning) based on searchPhrase and filters
 */
const buildSearchQuery = (builder, { categoryId, subcategoryId, searchPhrase, onSaleOnly, newOnly, priceRange }) => {
  const now = new Date().toISOString()

  const makeQueryWithSuffix = (suffix) => {
    const doSearch = searchPhrase && searchEngine.tokenizerFn(searchPhrase).length > 0
    let q = builder.select([
      'Products.ID as ID',
      doSearch ? 'relevance' : knex.raw('1 as relevance')
    ])
    .from('Products')
    .where('Active', 1)
    .whereNotNull('Products.Category' + suffix)

    if (categoryId) {
      q = q.where('Products.Category' + suffix, categoryId)
    }

    if (subcategoryId) {
      q = q.where('Products.SubCategory' + suffix, subcategoryId)
    }

    if (onSaleOnly) {
      q = q.where('SalePrice', '>', 0)
           .where('Sale_Start', '<=', now)
           .where('Sale_Stop', '>=', now)
    }

    if (newOnly) {
      q = q.where('Added', '>=', new Date(Date.now() - 1000 * 60 * 60 * 24 * 60))
    }

    if (priceRange) {
      if (priceRange.lower >= 0
       && priceRange.higher >= 0
       && priceRange.higher < priceRange.lower) {
        throw new Error("Lower must be greater than or equal to higher")
      }

      if (priceRange.lower >= 0) {
        q = WherePrice(q, '>=', priceRange.lower)
      }

      if (priceRange.higher >= 0) {
        q = WherePrice(q, '<=', priceRange.higher)
      }
    }

    if (doSearch) {
      const matchSku = builder.select(
        'Products.ID as id',
        knex.raw('9999 as relevance')
      )
      .from('Products')
      .where('ItemID', searchPhrase)

      q = q.innerJoin(
        matchSku.union(searchEngine.search(searchPhrase)).as('_Search' + suffix),
        '_Search' + suffix + '.id', 'Products.ID'
      )
    }

    return q
  }

  /**
  Builds queries like:

  SELECT {productsFields} FROM Products
    WHERE Active = 1 and Category is not null
    (categoryId?
      and Category = {categoryId}
    )
    (subcategoryId?
      and SubCategory = {subcategoryId}
    )
    (searchPhrase?
      INNER JOIN {searchQuery} as _Search ON _Search.id = Products.ID
    )
  UNION
  SELECT {productsFields} FROM Products
    WHERE Active = 1 and Category is not null
    (categoryId?
      and CategoryB = {categoryId}
    )
    (subcategoryId?
      and SubCategoryB = {subcategoryId}
    )
    (searchPhrase?
      INNER JOIN {searchQuery} as _Search ON _Search.id = Products.ID
    )
  UNION
  SELECT {productsFields} FROM Products
    WHERE Active = 1 and Category is not null
    (categoryId?
      and CategoryC = {categoryId}
    )
    (subcategoryId?
      and SubCategoryC = {subcategoryId}
    )
    (searchPhrase?
      INNER JOIN {searchQuery} as _Search ON _Search.id = Products.ID
    )

   */
  let query = null
  if (categoryId || subcategoryId) {
    query = makeQueryWithSuffix('')
      .union(makeQueryWithSuffix('B'))
      .union(makeQueryWithSuffix('C'))
  } else {
    query = makeQueryWithSuffix('')
  }
  return query
}

module.exports = buildSearchQuery
