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
  pgm.createTable('online_item_financials', {
    id: { type: 'serial', primaryKey: true },
    transaction_item_id: { 
      type: 'integer', 
      references: 'transaction_items', 
      onDelete: 'CASCADE', 
      notNull: true,
      unique: true 
    },
    commission_fee: { type: 'numeric(12,2)', default: 0 },
    shipping_fee: { type: 'numeric(12,2)', default: 0 },
    net_amount: { type: 'numeric(12,2)', notNull: true },
    gross_profit: { type: 'numeric(12,2)', default: 0 },
    net_profit: { type: 'numeric(12,2)', default: 0 },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('online_item_financials'); };
