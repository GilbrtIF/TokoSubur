'use strict';

exports.up = (pgm) => {
  pgm.createTable('reorder_settings', {
    setting_id: { type: 'serial', primaryKey: true },
    level: { type: 'varchar(6)', notNull: true },
    product_id: {
      type: 'integer',
      references: '"products"(product_id)',
    },
    parent_id: {
      type: 'integer',
      references: '"product_parents"(parent_id)',
    },
    min_stock_manual: { type: 'numeric(12,3)' },
    repack_trigger_qty: { type: 'numeric(12,3)' },
    reorder_point: { type: 'numeric(12,3)' },
    safety_stock: { type: 'numeric(12,3)' },
    lead_time_days: { type: 'integer' },
    lead_time_source: { type: 'varchar(20)' },
    service_level: { type: 'numeric(4,3)' },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint('reorder_settings', 'chk_reorder_settings_level', {
    check:
      "(level = 'SKU' AND product_id IS NOT NULL AND parent_id IS NULL) OR (level = 'PARENT' AND parent_id IS NOT NULL AND product_id IS NULL)",
  });

  pgm.sql(
    'CREATE UNIQUE INDEX ux_reorder_settings_level_product_id_parent_id ON reorder_settings (level, COALESCE(product_id, 0), COALESCE(parent_id, 0));'
  );
};

exports.down = (pgm) => {
  pgm.dropTable('reorder_settings');
};
