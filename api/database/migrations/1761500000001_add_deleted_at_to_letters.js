'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

// Letter.list() filters on `deleted_at IS NULL` but upstream never shipped a
// migration for the column (their production DB had it added by hand), so
// GET /letters and /homepage fail on a fresh database without this.
class AddDeletedAtToLettersSchema extends Schema {
  up () {
    this.table('letters', (table) => {
      table.timestamp('deleted_at').nullable()
    })
  }

  down () {
    this.table('letters', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}

module.exports = AddDeletedAtToLettersSchema
