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
  pgm.createTable('channels', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(50)', notNull: true, unique: true }, // 'Offline', 'Shopee', 'Tokopedia', 'TikTok Shop'
    type: { type: 'varchar(20)', notNull: true }, // 'offline' atau 'online'
  });
  
  pgm.sql(`INSERT INTO channels (name, type) VALUES ('Offline', 'offline'), ('Shopee', 'online'), ('Tokopedia', 'online'), ('TikTok Shop', 'online');`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => { pgm.dropTable('channels'); };