'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE stock_opname (
      tanggal DATE NOT NULL,
      sku VARCHAR(30) NOT NULL,
      stok_fisik NUMERIC(12,2) NOT NULL,
      stok_sistem NUMERIC(12,2),
      selisih NUMERIC(12,2),
      satuan_stok VARCHAR(10),
      catatan VARCHAR(200),
      aturan_sku VARCHAR(80),
      berkas VARCHAR(200),
      baris_excel INT,
      batch_id INT,
      PRIMARY KEY (tanggal, sku),
      FOREIGN KEY (sku) REFERENCES products(sku),
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS stock_opname;
  `);
};
