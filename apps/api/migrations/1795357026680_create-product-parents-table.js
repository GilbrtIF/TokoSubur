/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('product_parents', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true }, // e.g., 'Pupuk Urea', 'Benih Padi'
    base_unit: { type: 'varchar(10)', notNull: true }, // 'kg' atau 'pcs'
    is_repacked: { type: 'boolean', default: false }, // true jika dijual eceran per kg
    is_dummy: { type: 'boolean', default: true },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('product_parents'); };
