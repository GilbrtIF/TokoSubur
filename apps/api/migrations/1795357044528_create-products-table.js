'use strict';

exports.up = (pgm) => {
  pgm.createTable('products', {
    product_id: { type: 'serial', primaryKey: true },
    sku_code: { type: 'varchar(30)', notNull: true, unique: true },
    product_name: { type: 'varchar(150)', notNull: true },
    category: { type: 'varchar(30)', notNull: true },
    parent_id: {
      type: 'integer',
      references: '"product_parents"(parent_id)',
    },
    base_qty_per_unit: { type: 'numeric(10,4)' },
    is_bundle: { type: 'boolean', notNull: true, default: false },
    track_stock: { type: 'boolean', notNull: true, default: true },
    sold_offline: { type: 'boolean', notNull: true },
    sold_online: { type: 'boolean', notNull: true },
    is_active: { type: 'boolean', notNull: true, default: true },
    price_source: { type: 'varchar(10)', notNull: true },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('products');
};
