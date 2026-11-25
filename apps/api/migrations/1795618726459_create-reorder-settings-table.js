'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE reorder_settings (
      sku VARCHAR(30) PRIMARY KEY,
      stok_minimum_manual NUMERIC(12,2),
      titik_pesan_ulang NUMERIC(12,2),
      stok_pengaman NUMERIC(12,2),
      lead_time_hari INT,
      sumber_lead_time VARCHAR(20),
      level_layanan NUMERIC(4,3),
      diperbarui_pada TIMESTAMP,
      FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS reorder_settings;
  `);
};
