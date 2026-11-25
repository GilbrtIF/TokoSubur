'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE penjualan_ambigu (
      tanggal DATE NOT NULL,
      bulan VARCHAR(7) NOT NULL,
      kanal VARCHAR(30) NOT NULL,
      teks_asli VARCHAR(200),
      qty NUMERIC(12,2) NOT NULL,
      subtotal NUMERIC(16,2) NOT NULL,
      sku_kandidat VARCHAR(300) NOT NULL,
      alasan VARCHAR(300),
      berkas VARCHAR(200),
      baris_excel INT,
      FOREIGN KEY (kanal) REFERENCES channels(kanal)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS penjualan_ambigu;
  `);
};
