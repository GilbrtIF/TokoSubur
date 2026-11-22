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
  pgm.createTable('import_batches', {
    id: { type: 'serial', primaryKey: true },
    channel_id: { 
      type: 'integer', 
      references: 'channels', 
      onDelete: 'SET NULL' 
    },
    file_name: { type: 'varchar(255)', notNull: true },
    total_rows: { type: 'integer', default: 0 },
    duplicate_rows: { type: 'integer', default: 0 },
    error_rows: { type: 'integer', default: 0 },
    // Tanggal batas data lengkap (untuk training AI)
    data_complete_until: { type: 'date' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    is_dummy: { type: 'boolean', default: false },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('import_batches'); };
