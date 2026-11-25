'use strict';

exports.up = (pgm) => {
  pgm.createTable('model_runs', {
    run_id: { type: 'serial', primaryKey: true },
    model_name: { type: 'varchar(40)', notNull: true },
    model_version: { type: 'varchar(20)', notNull: true },
    trained_at: { type: 'timestamp', notNull: true },
    train_start: { type: 'date', notNull: true },
    train_end: { type: 'date', notNull: true },
    test_start: { type: 'date', notNull: true },
    test_end: { type: 'date', notNull: true },
    mape: { type: 'numeric(8,4)' },
    rmse: { type: 'numeric(12,4)' },
    wape: { type: 'numeric(8,4)' },
    is_active: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('model_runs');
};
