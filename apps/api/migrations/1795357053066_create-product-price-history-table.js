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
  pgm.createTable('product_price_history', {
    id: { type: 'serial', primaryKey: true },
    product_id: { type: 'integer', references: 'products', onDelete: 'CASCADE', notNull: true },
    cost_price: { type: 'numeric(12,2)', notNull: true }, // Harga modal
    sell_price: { type: 'numeric(12,2)', notNull: true }, // Harga jual
    valid_from: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    valid_to: { type: 'timestamp' }, // NULL jika masih berlaku (harga saat ini)
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('product_price_history'); };
