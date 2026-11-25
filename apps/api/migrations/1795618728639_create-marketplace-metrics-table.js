'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE marketplace_metrics (
      periode VARCHAR(7) NOT NULL,
      periode_mulai DATE NOT NULL,
      periode_akhir DATE NOT NULL,
      kanal VARCHAR(30) NOT NULL,
      sku VARCHAR(30) NOT NULL,
      impresi INT,
      klik INT,
      pesanan INT,
      rating NUMERIC(3,2),
      jumlah_ulasan INT,
      harga_tayang NUMERIC(14,2),
      aturan_sku VARCHAR(80),
      sku_inferred BOOLEAN NOT NULL DEFAULT FALSE,
      berkas VARCHAR(200),
      baris_excel INT,
      batch_id INT,
      PRIMARY KEY (periode, kanal, sku),
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      FOREIGN KEY (sku) REFERENCES products(sku),
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS marketplace_metrics;
  `);
};
