const db = require('../knex')

let _migrationPromise = null

const runMigration = async () => {
  console.log('Automigrating database')
  // NOOP
  // if (!(await db.schema.hasColumn('Category', 'image'))) {
  //   console.log('Category needs column image')
  //   await db.schema.alterTable('Category', table => {
  //     table.string('image').nullable()
  //   })
  // }
  // if (!(await db.schema.hasColumn('Subcategory', 'image'))) {
  //   console.log('Subcategory needs column image')
  //   await db.schema.alterTable('Subcategory', table => {
  //     table.string('image').nullable()
  //   })
  // }
}

const migrate = async () => {
  if (!_migrationPromise) {
    _migrationPromise = runMigration()
  }
  return await _migrationPromise
}

module.exports = migrate
