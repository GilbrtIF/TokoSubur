/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    username: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      check: "role IN ('admin', 'owner', 'co-owner')",
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.sql(`
    INSERT INTO users (username, password_hash, name, role) VALUES 
    ('admin', 'password123', 'Administrator Sistem', 'admin'),
    ('fauzi', 'fauzi123', 'Fauzi', 'owner'),
    ('istri', 'istri123', 'Istri Fauzi', 'co-owner');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
