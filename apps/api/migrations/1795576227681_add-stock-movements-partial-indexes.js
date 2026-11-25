'use strict';

exports.up = (pgm) => {
  pgm.createIndex('stock_movements', 'product_id', {
    name: 'idx_stock_movements_sku_product_id',
    where: `"level" = 'SKU'`,
  });

  pgm.createIndex('stock_movements', 'parent_id', {
    name: 'idx_stock_movements_parent_parent_id',
    where: `"level" = 'PARENT'`,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('stock_movements', 'parent_id', {
    name: 'idx_stock_movements_parent_parent_id',
  });

  pgm.dropIndex('stock_movements', 'product_id', {
    name: 'idx_stock_movements_sku_product_id',
  });
};
