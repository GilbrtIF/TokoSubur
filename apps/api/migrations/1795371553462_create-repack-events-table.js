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
  pgm.createTable('repack_events', {
    id: { type: 'serial', primaryKey: true },
    dedup_key: { type: 'varchar(255)', notNull: true, unique: true }, // Mencegah duplikasi data
    parent_id: { 
      type: 'integer', references: 'product_parents', onDelete: 'RESTRICT', notNull: true 
    },
    product_id: { 
      type: 'integer', references: 'products', onDelete: 'RESTRICT', notNull: true 
    }, // SKU hasil pecahan
    qty_used_kg: { type: 'numeric(10,2)', notNull: true }, // Contoh: 12 (kg)
    qty_produced_pcs: { type: 'integer', notNull: true }, // Contoh: 23 (kemasan)
    qty_expected_kg: { type: 'numeric(10,2)', notNull: true }, // Seharusnya (23 * 0.5 = 11.5 kg)
    shrinkage_kg: { type: 'numeric(10,2)', notNull: true }, // Susut (12 - 11.5 = 0.5 kg)
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('repack_events'); };
