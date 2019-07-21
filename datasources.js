const { SQLDataSource } = require("datasource-sql")
const knex = require('./knex')
const searchEngine = require('./searchEngine')

const CACHE_TTL = 300

const WaitPromise = (ms) => {
  return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), ms)
  })
}

const dbWithRetry = async (dbfn, nRetries = 5, waitTime = 100, waitGrowth = 2.5) => {
  let lastErr = null
  for (let i = 0; i < nRetries; i++) {
    try {
      const retVal = await dbfn()
      return retVal
    } catch (err) {
      lastErr = err
      console.error('DB encountered error, trying again after', waitTime, 'ms', err)
      await WaitPromise(waitTime)
      waitTime *= waitGrowth
    }
  }
  throw new Error(lastErr && lastErr.message || lastErr || 'Maximum retries exceeded, no error message')
}

const validateArgs = (args) => {
  args = Object.assign({}, { skip: 0, limit: 50, sort: 'relevancy' }, args)
  if (args.limit > 200) args.limit = 200
  if (args.skip < 0) args.skip = 0
  return args
}

const categoryFields = [
  'Category.ID as ID',
  'Category.Category as Category',
  'Category.Comments as Comments',
  'Category.image as image',
]

const cartItemFields = [
  'Cart.ID as CartItemId',
  'CustomerID as OrderNo',
  'Quantity',
  'Option',
]

const effectivePriceCase = knex.raw(`(CASE
  WHEN Products.Price1 > 0
    THEN Products.Price1
  WHEN Products.SalePrice > 0
   AND Products.Sale_Start <= CURRENT_TIMESTAMP
   AND Products.Sale_Stop >= CURRENT_TIMESTAMP
   THEN Products.SalePrice
  ELSE Products.ItemPrice
  END) as EffectivePrice`)

const productFields =  [
  'Products.ID as ProductID',
  'Qty',
  'Clearance',
  'Products.ItemID as ItemID',
  'Products.ItemName as ItemName',
  'Description',
  'Products.ItemPrice as ItemPrice',
  effectivePriceCase,
  'Thumbnail',
  'Products.Image as Image',
  'Hyperlinked_Image as hyperlinkedImage',
  'SalePrice',
  'Sale_Start',
  'Sale_Stop',
  'Price1',
  'Price2',
  'Price3',
  'Price4',
  'Price5',
  'Price6',
  'Price7',
  'Price8',
  'Price9',
  'Price10',
  'Option1',
  'Option2',
  'Option3',
  'Option4',
  'Option5',
  'Option6',
  'Option7',
  'Option8',
  'Option9',
  'Option10',
  'Category.Category as Category',
  'Category.ID as CategoryId',
  'Subcategory.Subcategory as Subcategory',
  'Subcategory.ID as SubcategoryId',
  'CategoryB',
  'SubCategoryB',
  'CategoryC',
  'SubCategoryC',
  'Keywords',
]

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

class MyDB extends SQLDataSource {
  constructor() {
    super()
    this.knex = knex
    this._hasMigrated = false
  }

  async migrate() {
    if (!this._hasMigrated) {
      this._hasMigrated = true
      this._migrationPromise = (async () => {
        console.log('Automigrating database')
        if (!(await this.db.schema.hasColumn('Category', 'image'))) {
          console.log('Category needs column image')
          await this.db.schema.alterTable('Category', table => {
            table.string('image').nullable()
          })
        }
        if (!(await this.db.schema.hasColumn('Subcategory', 'image'))) {
          console.log('Subcategory needs column image')
          await this.db.schema.alterTable('Subcategory', table => {
            table.string('image').nullable()
          })
        }
      })()
    }
    return await this._migrationPromise
  }

  async getWishList(uid) {
    if (!uid) throw new Error('uid is required')
    return await dbWithRetry(() => this.db.select(['WishList.Date as AddedDate', 'WishList.ID as WishListID'].concat(productFields))
      .from('WishList')
      .where('AccountID', uid)
      .innerJoin('Products', 'WishList.ItemID', 'Products.ID')
      .innerJoin('Category', 'Products.Category', 'Category.ID')
      .innerJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID'))
  }

  async isInWishlist(uid, productId) {
    if (!uid) throw new Error('uid is required')
    if (!productId) throw new Error('productId is required')
    const result = await dbWithRetry(() => this.db.select('ID')
      .from('WishList')
      .where('AccountID', uid)
      .where('ItemID', productId)
      .first())
    return !!result
  }

  async addToWishList(uid, productId) {
    if (!uid) throw new Error('uid is required')
    if (!productId) throw new Error('productId is required')
    // TODO: fix this race condition
    const isInWishlist = await this.isInWishlist(uid, productId)
    if (isInWishlist) return
    await this.db('WishList').insert({ AccountID: uid, ItemID: productId })
  }

  async removeFromWishList(uid, productId) {
    if (!uid) throw new Error('uid is required')
    if (!productId) throw new Error('productId is required')
    await this.db('WishList').where({ AccountID: uid, ItemID: productId }).limit(1).del()
  }

  async listPromos() {
    return this.db.select('*').from('Promotions')
  }

  async insertPromo(row) {
    if (!row || !row.Starts || !row.Ends || !row.Coupon) {
      throw new Error("promo missing required fields")
    }
    return this.db('Promotions').insert(row).returning('ID')
  }

  async updatePromo(promoId, patch) {
    if (!promoId) throw new Error('promo id is required')
    return this.db('Promotions').where('ID', promoId).update(patch)
  }

  async getPromoById(id) {
    if (!id)
      throw new Error('id required')
    else
      return await this.db.select('*').from('Promotions')
        .where('ID', id)
        .first()
  }

  async getPromo(coupon_code) {
    if (!coupon_code)
      throw new Error('coupon_code required')
    else
      return await this.db.select('*').from('Promotions')
        .where('Coupon', coupon_code)
        .where('Starts', '<=', new Date())
        .where('Ends', '>=', new Date())
        .first()
  }

  async deletePromo(promoId) {
    const promo = await this.getPromoById(promoId)
    if (!promo)
      throw new Error("promo does not exist")
    this.db('Promotions').where('ID', promoId).limit(1).del()
  }

  async getCategory(categoryId) {
    if (!categoryId) return Promise.reject(`categoryId is required`)
    await this.migrate()
    const query = this.db
      .select(categoryFields)
      .from('Category')
      .where('Category.ID', categoryId)
    // todo fix cache consistency issues here
    return dbWithRetry(() => this.getCached(query, CACHE_TTL))
  }

  insertCategory({ title, comments }) {
    if (!title) return Promise.reject(`title is required`)
    return this.db('Category').insert({ Category: title, Comments: comments }).returning('ID')
  }

  async getCategoryImage(categoryId) {
    if (!categoryId) return Promise.reject(`categoryId is required`)
    await this.migrate()
    const query = this.db.select('image').from('Category').where('ID', categoryId)
    const [ { image } ] = await dbWithRetry(() => this.getCached(query, CACHE_TTL))
    return image
  }

  async updateCategory(categoryId, { title, comments, image }) {
    if (!categoryId) return Promise.reject(`categoryId is required`)
    await this.migrate()
    return await this.db('Category').where('ID', categoryId).limit(1).update({ Category: title, Comments: comments, image })
  }

  listCategories() {
    const query = this.db
      .select(categoryFields)
      .from('Category')
      .where('Category.Category', 'like', '%-%')
      .orderBy('Category.Category', 'ASC')

    return dbWithRetry(() => this.getCached(query, CACHE_TTL))
  }

  listSaleCategories() {
    const now = new Date().toISOString()
    let makeSaleQuery = (fieldName) => (
      this.db.select(fieldName + ' as ID')
        .from('Products')
        .where('Active', 1)
        .where('SalePrice', '>', 0)
        .where('Sale_Start', '<=', now)
        .where('Sale_Stop', '>=', now)
    )

    const inner = makeSaleQuery('Category')
      .union(makeSaleQuery('CategoryB'))
      .union(makeSaleQuery('CategoryC'))

    const query = this.db.select(categoryFields)
      .from('Category')
      .innerJoin(inner.as('t1'), 'Category.ID', 't1.ID')
      .orderBy('Category.Category', 'ASC')

    return dbWithRetry(() => query)
  }

  insertSubcategory({ categoryId, title, comments }) {
    if (!title) throw new Error('title is required')
    if (!categoryId) throw new Error('categoryId is required')
    return this.db('Subcategory').insert({ Category: categoryId, Subcategory: title, Comments: comments }).returning('ID')
  }

  async getSubcategory(subcategoryId) {
    if (!subcategoryId) throw new Error('subcategory ID is required')
    await this.migrate()
    return dbWithRetry(() => this.getCached(this.db.select(
        'Subcategory.ID as ID',
        'Subcategory.Subcategory as Category',
        'Comments',
        'Subcategory.image as image',
      )
      .from('Subcategory')
      .where('ID', subcategoryId), CACHE_TTL))
  }

  async getSubcategoryImage(subcategoryId) {
    if (!subcategoryId) return Promise.reject(`subcategoryId is required`)
    await this.migrate()
    const query = this.db.select('image').from('Subcategory').where('ID', subcategoryId)
    const [ { image } ] = await dbWithRetry(() => this.getCached(query, CACHE_TTL))
    return image
  }

  async updateSubcategory(subcategoryId, { categoryId, title, comments, image }) {
    if (!subcategoryId) throw new Error('subcategory ID is required')
    await this.migrate()
    return await this.db('Subcategory')
      .where('ID', subcategoryId)
      .limit(1)
      .update({ Category: categoryId, Subcategory: title, Comments: comments, image })
  }

  listSubcategories(categoryId) {
    let query = this.db
      .select('Subcategory.ID as ID', 'Subcategory.Subcategory as Category', 'Comments')
      .from('Subcategory')
      .orderBy('Subcategory.Subcategory', 'ASC')
    if (categoryId)
      query = query.where('Subcategory.Category', '=', categoryId)
    return dbWithRetry(() => this.getCached(query, CACHE_TTL))
  }

  insertProduct(productData) {
    if (!productData) return Promise.reject(`productData is required`)
    return this.db('Products').insert(productData).returning('ID')
  }

  updateProduct(productId, productData) {
    if (!productId || !productData) return Promise.reject(`productId and productData are required`)
    return this.db('Products')
      .where('Products.ID', productId)
      .limit(1)
      .update(productData)
  }

  getProduct(productId) {
    if (!productId) return Promise.reject(`productId is required`)
    const query = this.db.select(productFields)
    .from('Products')
    .where('Products.ID', productId)
    .leftJoin('Category', 'Products.Category', 'Category.ID')
    .leftJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
    return dbWithRetry(() => this.getCached(query, CACHE_TTL))
  }

  listProductsTotal(args) {
    args = validateArgs(args)
    const searchQueryNoAs = buildSearchQuery(this.db, args)
    const searchQuery = searchQueryNoAs.as('Search')
    const countQuery = this.db.count('* as nRecords').from(searchQuery)
    console.log('listProductsTotal', countQuery.toString())
    const self = this
    return dbWithRetry(() => self.getCached(countQuery, CACHE_TTL))
  }

  listProductsCategories(args) {
    args = validateArgs(args)
    const searchQueryNoAs = buildSearchQuery(this.db, args)
    const categoryQuery = this.db.select(categoryFields)
      .from('Category')
      .orderBy('Category', 'ASC')
      .whereIn('Category.ID',
        this.db.select('Category')
          .from(searchQueryNoAs.clone().as('Search1'))
          .innerJoin('Products', 'Products.ID', 'Search1.ID')
          .union(
            this.db.select('CategoryB as Category')
              .from(searchQueryNoAs.clone().as('Search2'))
              .innerJoin('Products', 'Products.ID', 'Search2.ID')
          )
          .union(
            this.db.select('CategoryC as Category')
              .from(searchQueryNoAs.clone().as('Search3'))
              .innerJoin('Products', 'Products.ID', 'Search3.ID')
          )
      )
      console.log('listProductsCategories', categoryQuery.toString())
      const self = this
      return dbWithRetry(() => self.getCached(categoryQuery, CACHE_TTL))
  }

  listProductsSubcategories(args) {
    args = validateArgs(args)
    const searchQueryNoAs = buildSearchQuery(this.db, args)
    const subcategoryQuery = this.db.select(
      'Subcategory.ID as ID',
      'Subcategory.Subcategory as Category',
      'Comments',
      'Subcategory.image as image'
    )
    .from('Subcategory')
    .where('Subcategory.Category', '=', args.categoryId)
    .orderBy('Subcategory.Subcategory', 'ASC')
    .whereIn('Subcategory.ID',
      this.db.select('Subcategory')
        .from(searchQueryNoAs.clone().as('Search1'))
        .innerJoin('Products', 'Products.ID', 'Search1.ID')
        .union(
          this.db.select('SubcategoryB as Subcategory')
            .from(searchQueryNoAs.clone().as('Search2'))
            .innerJoin('Products', 'Products.ID', 'Search2.ID')
        )
        .union(
          this.db.select('SubcategoryC as Subcategory')
            .from(searchQueryNoAs.clone().as('Search3'))
            .innerJoin('Products', 'Products.ID', 'Search3.ID')
        )
    )
    console.log('listProductsSubcategories', subcategoryQuery.toString())
    const self = this
    return dbWithRetry(() => self.getCached(subcategoryQuery, CACHE_TTL))
  }

  listProducts(args) {
    args = validateArgs(args)

    const searchQueryNoAs = buildSearchQuery(this.db, args)
    const searchQuery = searchQueryNoAs.as('Search')

    let dataQuery =  this.db.select(productFields)
      .from(searchQuery.clone())
      .innerJoin('Products', 'Search.ID', 'Products.ID')
      .innerJoin('Category', 'Products.Category', 'Category.ID')
      .innerJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
      .offset(args.skip)
      .limit(args.limit)

    if (args.sort == 'alpha') {
      dataQuery = dataQuery.orderBy('ItemName', 'asc')
    }
    else if (args.sort == 'mostRecent') {
      dataQuery = dataQuery.orderBy('Products.ID', 'desc')
    }
    else if (args.sort == 'priceAsc') {
      dataQuery = dataQuery.orderBy('EffectivePrice', 'asc')
    }
    else if (args.sort == 'priceDesc') {
      dataQuery = dataQuery.orderBy('EffectivePrice', 'desc')
    }
    else if (args.sort == 'random') {
      dataQuery = dataQuery.orderByRaw(process.env.SQL_ENGINE == 'mssql' ? 'NEWID()' : process.env.SQL_ENGINE == 'mysql' ? 'RAND()' : 'RANDOM()')
    }
    // relevance by default
    else {
      dataQuery = dataQuery
        .orderBy('relevance', 'desc')
        .orderBy('Products.ID', 'desc')
    }
    console.log('listProducts', dataQuery.toString())
    const self = this
    return dbWithRetry(() => self.getCached(dataQuery, CACHE_TTL))
  }

  tryUpsertUser(email, user) {
    return this.findUser(email).then((result) => {
      if (result) {
        return Promise.reject(new Error('User already exists'))
      } else {
        return this.db('CustomerAccounts').insert(user).returning('ID')
      }
    })
  }

  findUserById(uid) {
    if (!uid) throw new Error('uid is required')
    return dbWithRetry(() => this.db.select('*')
      .from('CustomerAccounts')
      .where('ID', uid)
      .first())
  }

  findUser(email) {
    return dbWithRetry(() => this.db.select('*')
      .from('CustomerAccounts')
      .where('Email', email)
      .first())
  }

  updateUser(uid, patch) {
    if (!uid) throw new Error('uid is required')
    return this.db('CustomerAccounts')
      .where('ID', uid)
      .limit(1)
      .update(patch)
  }

  nextCartNumber() {
      return dbWithRetry(() => this.db.select('CustomerID').from('Cart').orderBy('CustomerID', 'DESC').first()).then((r) =>
        r && r.CustomerID && (Number.parseInt(r.CustomerID) + 1)
      )
  }

  listCartItems(cartId) {
    return dbWithRetry(() => this.db.select(cartItemFields.concat(productFields))
      .from('Cart')
      .leftJoin('Products', 'Products.ID', 'Cart.ProductID')
      .leftJoin('Category', 'Products.Category', 'Category.ID')
      .leftJoin('Subcategory', 'Products.SubCategory', 'Subcategory.ID')
      .where('CustomerID', cartId))
  }

  async getCartItem(cartItemId) {
    if (!cartItemId) {
      throw new Error('cartItemId not set')
    }
    return await dbWithRetry(() => this.db.select('*').from('Cart').where('ID', cartItemId).first())
  }

  insertCartItem(cartId, qty, productId, variant) {
    const self = this
    return self.getProduct(productId).then((product) => {
      if (!product || product.length == 0) {
        return Promise.reject(new Error('Product does not exist'));
      }
      else {
        product = product[0]
        const q = this.db('Cart').insert({
          CustomerID: cartId,
          ProductID: productId,
          Quantity: qty,
          ItemID: product.ItemID,
          ItemName: product.ItemName,
          ItemPrice: product.ItemPrice,
          Subtotal: product.ItemPrice,
          Option: variant || '',
          Handling_Charge: 0,
        })
        return q.then(() => {
          return self.listCartItems(cartId)
        })
      }
    })
  }

  updateCartItem(cartItemId, qty, variant) {
    if (cartItemId) {
      return this.getCartItem(cartItemId).then((result) => {
        if (!result) {
          return Promise.reject(new Error('Invalid cart item id'))
        } else if (result.ID != cartItemId) {
          return Promise.reject(new Error('Cart item did not match ID'))
        }
        else {
          return this.db('Cart').where('ID', result.ID).update({ Quantity: qty, Option: variant || '' }).limit(1).then(() => result.CustomerID)
        }
      })
    } else {
      return Promise.reject(new Error('Invalid cart item id'))
    }
  }

  deleteCartItem(cartItemId) {
    if (cartItemId) {
      return this.getCartItem(cartItemId).then((result) => {
        if (!result) {
          return Promise.reject(new Error('Invalid cart item id'))
        }
        else if (result.ID != cartItemId) {
          return Promise.reject(new Error('Cart item did not match ID'))
        }
        else {
          return this.db('Cart').where('ID', result.ID).limit(1).del().then(() => result.CustomerID)
        }
      })
    } else {
      return Promise.reject(new Error('Invalid cart item id'))
    }
  }

  placeOrder(orderData) {
    return this.db('CustomerInfo').insert(orderData).returning('ID')
  }

  getCustomerInfo(orderId) {
    return dbWithRetry(() => this.db.select('*').from('CustomerInfo').where('CustomerID', orderId).first())
  }

  getTaxTables() {
    const query = this.db.select('*').from('TaxTables')
    return dbWithRetry(() => this.getCached(query, CACHE_TTL))
  }
}

exports.MyDB = MyDB
