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
  pgm.createTable('stock_movements', {
    id: { type: 'serial', primaryKey: true },
    dedup_key: { type: 'varchar(255)', notNull: true, unique: true },
    movement_type_id: { 
      type: 'integer', references: 'stock_movement_types', onDelete: 'RESTRICT', notNull: true 
    },
    level: { type: 'varchar(10)', notNull: true, check: "level IN ('SKU', 'PARENT')" },
    product_id: { 
      type: 'integer', references: 'products', onDelete: 'RESTRICT' 
    }, // Diisi jika level = SKU
    parent_id: { 
      type: 'integer', references: 'product_parents', onDelete: 'RESTRICT' 
    }, // Diisi jika level = PARENT
    qty_change: { type: 'numeric(10,2)', notNull: true }, // Positif (masuk) atau Negatif (keluar)
    reference_id: { type: 'integer' }, // Opsional: ID dari transaksi, repack, atau opname
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  // Kendala CHECK: Harus menunjuk ke SKU ATAU PARENT, tidak boleh keduanya sekaligus
  pgm.addConstraint('stock_movements', 'check_level_reference', {
    check: "(level = 'SKU' AND product_id IS NOT NULL AND parent_id IS NULL) OR (level = 'PARENT' AND parent_id IS NOT NULL AND product_id IS NULL)"
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('stock_movements'); };
