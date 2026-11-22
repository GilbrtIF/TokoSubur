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
  pgm.createTable('product_mapping', {
    id: { type: 'serial', primaryKey: true },
    raw_name: { type: 'varchar(255)', notNull: true, unique: true }, // Nama produk di file mentah (misal: "Urea 50kg Subsidi")
    product_id: { 
      type: 'integer', 
      references: 'products', 
      onDelete: 'CASCADE', 
      notNull: true 
    }, // SKU internal kita (misal: PUP-URE-001)
    channel_id: { 
      type: 'integer', 
      references: 'channels', 
      onDelete: 'SET NULL' 
    }, // Opsional: Mapping khusus untuk channel tertentu
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('product_mapping'); };
