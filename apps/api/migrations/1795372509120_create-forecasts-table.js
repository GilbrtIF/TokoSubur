'use strict';

exports.up = (pgm) => {
  pgm.createTable('forecasts', {
    forecast_id: { type: 'serial', primaryKey: true },
    run_id: {
      type: 'integer',
      notNull: true,
      references: '"model_runs"(run_id)',
    },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    channel_id: {
      type: 'integer',
      references: '"channels"(channel_id)',
    },
    forecast_period: { type: 'date', notNull: true },
    granularity: { type: 'varchar(8)', notNull: true },
    qty_pred: { type: 'numeric(12,3)', notNull: true },
    qty_lower: { type: 'numeric(12,3)' },
    qty_upper: { type: 'numeric(12,3)' },
    generated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint('forecasts', 'chk_forecasts_granularity', {
    check: "granularity IN ('WEEKLY','MONTHLY')",
  });
};

exports.down = (pgm) => {
  pgm.dropTable('forecasts');
};
