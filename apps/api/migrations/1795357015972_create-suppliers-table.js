'use strict';

exports.up = (pgm) => {
  pgm.createTable('suppliers', {
    supplier_id: { type: 'serial', primaryKey: true },
    supplier_code: { type: 'varchar(10)', notNull: true, unique: true },
    supplier_name: { type: 'varchar(80)', notNull: true },
    product_group: { type: 'varchar(60)' },
    lead_time_days: { type: 'integer' },
    lead_time_source: { type: 'varchar(20)', notNull: true, default: 'ASUMSI' },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('suppliers');
};
