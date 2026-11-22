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
  pgm.createTable('forecasts', {
    id: { type: 'serial', primaryKey: true },
    model_run_id: { type: 'integer', references: 'model_runs', onDelete: 'CASCADE', notNull: true },
    product_id: { type: 'integer', references: 'products', onDelete: 'CASCADE', notNull: true },
    forecast_date: { type: 'date', notNull: true },
    predicted_demand: { type: 'numeric(10,2)', notNull: true },
    lower_bound: { type: 'numeric(10,2)' },
    upper_bound: { type: 'numeric(10,2)' },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('forecasts'); };
