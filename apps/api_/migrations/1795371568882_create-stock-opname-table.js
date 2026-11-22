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
  pgm.createTable('stock_opname', {
    id: { type: 'serial', primaryKey: true },
    opname_date: { type: 'date', notNull: true },
    level: { type: 'varchar(10)', notNull: true, check: "level IN ('SKU', 'PARENT')" },
    product_id: { type: 'integer', references: 'products', onDelete: 'RESTRICT' },
    parent_id: { type: 'integer', references: 'product_parents', onDelete: 'RESTRICT' },
    system_qty: { type: 'numeric(10,2)', notNull: true }, // Stok menurut sistem sebelum opname
    physical_qty: { type: 'numeric(10,2)', notNull: true }, // Stok asli di lapangan
    diff_qty: { type: 'numeric(10,2)', notNull: true }, // Selisih
    reason: { type: 'varchar(100)' }, // Contoh: 'Rusak', 'Retur', 'Lengkap'
    notes: { type: 'text' },
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  pgm.addConstraint('stock_opname', 'check_opname_level', {
    check: "(level = 'SKU' AND product_id IS NOT NULL AND parent_id IS NULL) OR (level = 'PARENT' AND parent_id IS NOT NULL AND product_id IS NULL)"
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('stock_opname'); };
