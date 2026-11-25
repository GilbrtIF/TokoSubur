'use strict';

exports.up = (pgm) => {
  pgm.createTable('transactions', {
    transaction_id: { type: 'serial', primaryKey: true },
    order_no: { type: 'varchar(60)', notNull: true },
    order_no_generated: { type: 'boolean', notNull: true, default: false },
    channel_id: {
      type: 'integer',
      notNull: true,
      references: '"channels"(channel_id)',
    },
    transaction_date: { type: 'date', notNull: true },
    customer_region: { type: 'varchar(80)' },
    customer_phone_masked: { type: 'varchar(20)' },
    payment_note: { type: 'varchar(30)' },
    source: { type: 'varchar(12)', notNull: true, default: 'IMPORT' },
    import_batch_id: {
      type: 'integer',
      references: '"import_batches"(batch_id)',
    },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });

  pgm.createIndex('transactions', ['channel_id', 'order_no'], {
    name: 'ux_transactions_channel_id_order_no',
    unique: true,
  });
};

exports.down = (pgm) => {
  pgm.dropTable('transactions');
};
