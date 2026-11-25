'use strict';

exports.up = (pgm) => {
  pgm.createTable('import_batches', {
    batch_id: { type: 'serial', primaryKey: true },
    import_type: { type: 'varchar(20)', notNull: true },
    channel_id: {
      type: 'integer',
      references: '"channels"(channel_id)',
    },
    file_name: { type: 'varchar(200)', notNull: true },
    period_start: { type: 'date', notNull: true },
    period_end: { type: 'date', notNull: true },
    data_complete_until: { type: 'date' },
    rows_total: { type: 'integer', notNull: true, default: 0 },
    rows_new: { type: 'integer', notNull: true, default: 0 },
    rows_duplicate: { type: 'integer', notNull: true, default: 0 },
    rows_error: { type: 'integer', notNull: true, default: 0 },
    rows_unmapped: { type: 'integer', notNull: true, default: 0 },
    status: { type: 'varchar(12)', notNull: true },
    imported_by: { type: 'varchar(60)' },
    imported_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint('import_batches', 'chk_import_batches_import_type', {
    check:
      "import_type IN ('SALES_OFFLINE','SALES_ONLINE','STOCK_MOVEMENT','REPACK','OPNAME','MARKETPLACE_METRICS')",
  });

  pgm.addConstraint('import_batches', 'chk_import_batches_status', {
    check: "status IN ('PREVIEW','CONFIRMED','ROLLED_BACK')",
  });
};

exports.down = (pgm) => {
  pgm.dropTable('import_batches');
};
