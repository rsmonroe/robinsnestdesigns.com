const { knex } = require('../db')

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

module.exports = productFields
