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
  pgm.createTable('transaction_items', {
    id: { type: 'serial', primaryKey: true },
    transaction_id: { 
      type: 'integer', 
      references: 'transactions', 
      onDelete: 'CASCADE', 
      notNull: true 
    },
    product_id: { 
      type: 'integer', 
      references: 'products', 
      onDelete: 'RESTRICT', 
      notNull: true 
    },
    line_no: { type: 'integer', notNull: true }, // Urutan baris (1, 2, 3...)
    qty: { type: 'numeric(10,2)', notNull: true },
    unit_price: { type: 'numeric(12,2)', notNull: true },
    subtotal: { type: 'numeric(12,2)', notNull: true },
    discount: { type: 'numeric(12,2)', default: 0 },
  });

  pgm.addConstraint('transaction_items', 'unique_transaction_line', {
    unique: ['transaction_id', 'line_no']
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('transaction_items'); };
