'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE product_mapping (
      sumber VARCHAR(30) NOT NULL,
      teks VARCHAR(200) NOT NULL,
      contoh_teks_asli VARCHAR(200),
      jumlah_baris INT NOT NULL,
      baris_masuk INT NOT NULL,
      aturan VARCHAR(120),
      sku_hasil VARCHAR(200),
      status VARCHAR(20) NOT NULL,
      PRIMARY KEY (sumber, teks),
      CHECK (status IN ('masuk','ditolak','sebagian ditolak'))
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS product_mapping;
  `);
};
