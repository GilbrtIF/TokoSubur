'use strict';

exports.up = (pgm) => {
  pgm.createTable('product_parents', {
    parent_id: { type: 'serial', primaryKey: true },
    parent_key: { type: 'varchar(40)', notNull: true, unique: true },
    parent_name: { type: 'varchar(120)', notNull: true },
    base_unit: { type: 'varchar(5)', notNull: true },
    is_repacked: { type: 'boolean', notNull: true },
    purchase_unit: { type: 'varchar(10)', notNull: true },
    base_units_per_purchase: { type: 'numeric(10,2)', notNull: true },
    supplier_id: {
      type: 'integer',
      notNull: true,
      references: '"suppliers"(supplier_id)',
    },
  });

  pgm.addConstraint('product_parents', 'chk_product_parents_base_unit', {
    check: "base_unit IN ('kg','pcs')",
  });
};

exports.down = (pgm) => {
  pgm.dropTable('product_parents');
};
