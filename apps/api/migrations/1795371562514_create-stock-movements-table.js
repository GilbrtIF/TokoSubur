'use strict';

exports.up = (pgm) => {
  pgm.createTable('stock_movements', {
    movement_id: { type: 'serial', primaryKey: true },
    movement_date: { type: 'date', notNull: true },
    level: { type: 'varchar(6)', notNull: true },
    product_id: {
      type: 'integer',
      references: '"products"(product_id)',
    },
    parent_id: {
      type: 'integer',
      references: '"product_parents"(parent_id)',
    },
    movement_type: {
      type: 'varchar(20)',
      notNull: true,
      references: '"stock_movement_types"(type_code)',
    },
    qty_change: { type: 'numeric(12,3)', notNull: true },
    channel_id: {
      type: 'integer',
      references: '"channels"(channel_id)',
    },
    supplier_id: {
      type: 'integer',
      references: '"suppliers"(supplier_id)',
    },
    unit_cost: { type: 'numeric(14,2)' },
    ref_item_id: {
      type: 'integer',
      references: '"transaction_items"(item_id)',
    },
    ref_repack_id: {
      type: 'integer',
      references: '"repack_events"(repack_id)',
    },
    ref_opname_id: { type: 'integer' },
    notes: { type: 'varchar(200)' },
    dedup_key: { type: 'varchar(64)', notNull: true, unique: true },
    import_batch_id: {
      type: 'integer',
      references: '"import_batches"(batch_id)',
    },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });

  pgm.addConstraint('stock_movements', 'chk_stock_movements_level', {
    check:
      "(level = 'SKU' AND product_id IS NOT NULL AND parent_id IS NULL) OR (level = 'PARENT' AND parent_id IS NOT NULL AND product_id IS NULL)",
  });

  pgm.addConstraint('stock_movements', 'chk_stock_movements_qty_change', {
    check: 'qty_change <> 0',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('stock_movements');
};
