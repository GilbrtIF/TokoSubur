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
  pgm.createTable('reorder_settings', {
    id: { type: 'serial', primaryKey: true },
    product_id: { type: 'integer', references: 'products', onDelete: 'CASCADE' },
    parent_id: { type: 'integer', references: 'product_parents', onDelete: 'CASCADE' },
    repack_trigger_qty: { type: 'numeric(10,2)', default: 0 }, // Batas SKU harus dipecah
    reorder_point: { type: 'numeric(10,2)', default: 0 }, // Batas induk harus restok
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('reorder_settings'); };
