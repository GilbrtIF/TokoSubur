'use strict';

exports.up = (pgm) => {
  pgm.createTable('transaction_items', {
    item_id: { type: 'serial', primaryKey: true },
    transaction_id: {
      type: 'integer',
      notNull: true,
      references: '"transactions"(transaction_id)',
    },
    line_no: { type: 'integer', notNull: true },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    raw_product_name: { type: 'varchar(200)', notNull: true },
    qty: { type: 'numeric(10,2)', notNull: true },
    unit_price: { type: 'numeric(14,2)', notNull: true },
    discount_amount: { type: 'numeric(14,2)', notNull: true, default: 0 },
    subtotal: { type: 'numeric(14,2)', notNull: true },
  });

  pgm.addConstraint('transaction_items', 'chk_transaction_items_qty', {
    check: 'qty > 0',
  });

  pgm.createIndex('transaction_items', ['transaction_id', 'line_no'], {
    name: 'ux_transaction_items_transaction_id_line_no',
    unique: true,
  });
};

exports.down = (pgm) => {
  pgm.dropTable('transaction_items');
};
