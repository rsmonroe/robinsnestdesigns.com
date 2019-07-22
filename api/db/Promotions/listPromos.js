const { knex, readDB } = require('../db')

module.exports = () => readDB(knex.select('*').from('Promotions'), 'Promotions')
