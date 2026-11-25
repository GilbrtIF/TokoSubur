'use strict';

exports.up = (pgm) => {
  pgm.createTable('bundle_components', {
    bundle_product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    component_product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    qty_per_bundle: { type: 'numeric(10,4)', notNull: true },
  });

  pgm.addConstraint('bundle_components', 'pk_bundle_components', {
    primaryKey: ['bundle_product_id', 'component_product_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('bundle_components');
};
