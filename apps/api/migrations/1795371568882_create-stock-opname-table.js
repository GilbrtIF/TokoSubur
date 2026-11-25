'use strict';

exports.up = (pgm) => {
  pgm.createTable('stock_opname', {
    opname_id: { type: 'serial', primaryKey: true },
    opname_date: { type: 'date', notNull: true },
    level: { type: 'varchar(6)', notNull: true },
    product_id: {
      type: 'integer',
      references: '"products"(product_id)',
    },
    parent_id: {
      type: 'integer',
      references: '"product_parents"(parent_id)',
    },
    system_stock: { type: 'numeric(12,3)', notNull: true },
    physical_stock: { type: 'numeric(12,3)', notNull: true },
    difference: { type: 'numeric(12,3)', notNull: true },
    notes: { type: 'varchar(200)' },
    import_batch_id: {
      type: 'integer',
      references: '"import_batches"(batch_id)',
    },
  });

  pgm.addConstraint('stock_opname', 'chk_stock_opname_level', {
    check:
      "(level = 'SKU' AND product_id IS NOT NULL AND parent_id IS NULL) OR (level = 'PARENT' AND parent_id IS NOT NULL AND product_id IS NULL)",
  });

  pgm.sql(
    'CREATE UNIQUE INDEX ux_stock_opname_opname_date_level_product_id_parent_id ON stock_opname (opname_date, level, COALESCE(product_id, 0), COALESCE(parent_id, 0));'
  );
};

exports.down = (pgm) => {
  pgm.dropTable('stock_opname');
};
