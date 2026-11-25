'use strict';

exports.up = (pgm) => {
  pgm.createTable('marketplace_metrics', {
    metric_id: { type: 'serial', primaryKey: true },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    channel_id: {
      type: 'integer',
      notNull: true,
      references: '"channels"(channel_id)',
    },
    period_start: { type: 'date', notNull: true },
    period_end: { type: 'date', notNull: true },
    impressions: { type: 'integer' },
    clicks: { type: 'integer' },
    orders: { type: 'integer' },
    conversion_rate: { type: 'numeric(6,4)' },
    rating_avg: { type: 'numeric(3,2)' },
    review_count: { type: 'integer' },
    listed_price: { type: 'numeric(14,2)' },
    import_batch_id: {
      type: 'integer',
      references: '"import_batches"(batch_id)',
    },
    is_dummy: { type: 'boolean', notNull: true, default: true },
  });

  pgm.createIndex(
    'marketplace_metrics',
    ['product_id', 'channel_id', 'period_start'],
    {
      name: 'ux_marketplace_metrics_product_id_channel_id_period_start',
      unique: true,
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('marketplace_metrics');
};
