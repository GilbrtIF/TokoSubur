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
  pgm.createTable('products', {
    id: { type: 'serial', primaryKey: true },
    parent_id: { 
      type: 'integer', 
      references: 'product_parents', 
      onDelete: 'CASCADE' 
    },
    sku: { type: 'varchar(50)', notNull: true, unique: true }, // Kode unik internal, e.g., PUP-URE-001
    name: { type: 'varchar(150)', notNull: true }, // Nama jual, e.g., 'Pupuk Urea 50 kg'
    base_qty_per_unit: { type: 'numeric(10,2)', default: 1 }, // 1 karung = 50 kg, maka isi 50
    is_bundle: { type: 'boolean', default: false }, // true jika ini paket (tidak punya stok sendiri)
    track_stock: { type: 'boolean', default: true }, // false untuk SKU EXTRAPCKG (kardus)
    is_dummy: { type: 'boolean', default: true },
  });
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('products'); };
