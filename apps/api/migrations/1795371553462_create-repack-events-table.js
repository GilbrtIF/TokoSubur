'use strict';

exports.up = (pgm) => {
  pgm.createTable('repack_events', {
    repack_id: { type: 'serial', primaryKey: true },
    repack_date: { type: 'date', notNull: true },
    parent_id: {
      type: 'integer',
      notNull: true,
      references: '"product_parents"(parent_id)',
    },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    material_used_qty: { type: 'numeric(10,3)', notNull: true },
    packs_produced: { type: 'numeric(10,2)', notNull: true },
    expected_material_qty: { type: 'numeric(10,3)', notNull: true },
    loss_qty: { type: 'numeric(10,3)', notNull: true },
    notes: { type: 'varchar(200)' },
    source: { type: 'varchar(12)', notNull: true, default: 'IMPORT' },
    dedup_key: { type: 'varchar(64)', notNull: true, unique: true },
    import_batch_id: {
      type: 'integer',
      references: '"import_batches"(batch_id)',
    },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });

  pgm.addConstraint('repack_events', 'chk_repack_events_material_used_qty', {
    check: 'material_used_qty > 0',
  });

  pgm.addConstraint('repack_events', 'chk_repack_events_packs_produced', {
    check: 'packs_produced > 0',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('repack_events');
};
