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
  pgm.createTable('model_runs', {
    id: { type: 'serial', primaryKey: true },
    model_name: { type: 'varchar(100)', notNull: true }, // e.g., 'Prophet', 'XGBoost'
    version: { type: 'varchar(50)', notNull: true },
    is_active: { type: 'boolean', default: false }, // Hanya 1 yang aktif
    metrics: { type: 'jsonb' }, // Simpan MAE, RMSE, dll dalam JSON
    trained_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('model_runs'); };
