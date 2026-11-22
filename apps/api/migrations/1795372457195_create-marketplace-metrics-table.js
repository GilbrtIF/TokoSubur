/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('marketplace_metrics', {
    id: { type: 'serial', primaryKey: true },
    channel_id: { type: 'integer', references: 'channels', onDelete: 'CASCADE', notNull: true },
    metric_date: { type: 'date', notNull: true },
    visitors: { type: 'integer', default: 0 },
    conversion_rate: { type: 'numeric(5,2)', default: 0 }, // persentase
    is_dummy: { type: 'boolean', default: true },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('marketplace_metrics'); };
