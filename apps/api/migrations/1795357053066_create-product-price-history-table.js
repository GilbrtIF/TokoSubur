'use strict';

exports.up = (pgm) => {
  pgm.createTable('product_price_history', {
    price_id: { type: 'serial', primaryKey: true },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    valid_from: { type: 'date', notNull: true },
    valid_to: { type: 'date' },
    purchase_cost: { type: 'numeric(14,2)', notNull: true },
    packing_cost: { type: 'numeric(14,2)', notNull: true },
    cogs: { type: 'numeric(14,2)', notNull: true },
    online_price: { type: 'numeric(14,2)' },
    offline_price: { type: 'numeric(14,2)' },
  });

  pgm.createIndex('product_price_history', ['product_id', 'valid_from'], {
    name: 'ux_product_price_history_product_id_valid_from',
    unique: true,
  });
};

exports.down = (pgm) => {
  pgm.dropTable('product_price_history');
};
