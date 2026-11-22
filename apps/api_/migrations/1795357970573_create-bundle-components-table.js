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
  pgm.createTable('bundle_components', {
    id: { type: 'serial', primaryKey: true },
    bundle_product_id: { 
      type: 'integer', 
      references: 'products', 
      onDelete: 'CASCADE', 
      notNull: true 
    }, // ID produk paketnya
    component_product_id: { 
      type: 'integer', 
      references: 'products', 
      onDelete: 'CASCADE', 
      notNull: true 
    }, // ID produk komponennya
    qty: { 
      type: 'numeric(10,2)', 
      notNull: true 
    }, // Jumlah komponen yang dibutuhkan untuk 1 paket
  });
  
  // Opsional: Cegah duplikasi komponen yang sama di dalam satu paket
  pgm.addConstraint('bundle_components', 'unique_bundle_component', {
    unique: ['bundle_product_id', 'component_product_id']
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('bundle_components'); };
