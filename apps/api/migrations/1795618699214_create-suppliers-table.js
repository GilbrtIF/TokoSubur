'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE suppliers (
      supplier_code VARCHAR(10) PRIMARY KEY,
      nama_supplier VARCHAR(80) NOT NULL,
      kelompok_produk VARCHAR(60),
      lead_time_hari INT
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS suppliers;
  `);
};
