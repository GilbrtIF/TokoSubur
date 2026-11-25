'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE product_price_history (
      jenis_harga VARCHAR(15) NOT NULL,
      sku VARCHAR(30) NOT NULL,
      bulan DATE NOT NULL,
      harga NUMERIC(14,2) NOT NULL,
      jumlah_transaksi INT NOT NULL,
      PRIMARY KEY (jenis_harga, sku, bulan),
      FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE RESTRICT,
      CHECK (jenis_harga IN ('jual_offline','jual_online','beli'))
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS product_price_history;
  `);
};
