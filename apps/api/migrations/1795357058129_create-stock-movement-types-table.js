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
  pgm.createTable('stock_movement_types', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(50)', notNull: true, unique: true }, 
    // Contoh: IN_RESTOCK, OUT_SALE, REPACK_OUT, REPACK_IN, IN_RETURN, OUT_DAMAGED, ADJ_OPNAME
  });
  
  pgm.sql(`
    INSERT INTO stock_movement_types (name) VALUES 
    ('IN_RESTOCK'), ('OUT_SALE'), ('REPACK_OUT'), ('REPACK_IN'), ('IN_RETURN'), ('OUT_DAMAGED'), ('ADJ_OPNAME');
  `);
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('stock_movement_types'); };
