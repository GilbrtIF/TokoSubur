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
  pgm.createTable('transactions', {
    id: { type: 'serial', primaryKey: true },
    channel_id: { 
      type: 'integer', 
      references: 'channels', 
      onDelete: 'RESTRICT', 
      notNull: true 
    },
    order_no: { type: 'varchar(100)', notNull: true }, 
    transaction_date: { type: 'timestamp', notNull: true },
    customer_name: { type: 'varchar(100)' }, // Opsional untuk online
    subtotal: { type: 'numeric(12,2)', notNull: true, default: 0 },
    discount: { type: 'numeric(12,2)', default: 0 },
    shipping_cost: { type: 'numeric(12,2)', default: 0 },
    grand_total: { type: 'numeric(12,2)', notNull: true, default: 0 },
    // Penanda jika nota offline tidak bernomor (dibuat oleh sistem)
    order_no_generated: { type: 'boolean', default: false },
    import_batch_id: { 
      type: 'integer', 
      references: 'import_batches', 
      onDelete: 'SET NULL' 
    },
    is_dummy: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  // Kunci duplikasi: 1 order_no unik per channel
  pgm.addConstraint('transactions', 'unique_channel_order', {
    unique: ['channel_id', 'order_no']
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('transactions'); };
