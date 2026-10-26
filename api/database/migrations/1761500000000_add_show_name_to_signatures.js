'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

// MSEG: signers may ask to appear as "Anonymous". The name is still stored
// (so MSEG can verify who signed); the API hides it in public responses.
class AddShowNameToSignaturesSchema extends Schema {
  up () {
    this.table('signatures', (table) => {
      table.boolean('show_name').notNullable().defaultTo(true)
    })
  }

  down () {
    this.table('signatures', (table) => {
      table.dropColumn('show_name')
    })
  }
}

module.exports = AddShowNameToSignaturesSchema
