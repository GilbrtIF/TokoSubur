'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE VIEW v_stok_saat_ini AS
    SELECT
      p.sku,
      COALESCE(SUM(sm.qty), 0) AS stok
    FROM products p
    LEFT JOIN stock_movements sm ON sm.sku = p.sku
    GROUP BY p.sku;

    CREATE VIEW v_penjualan_harian AS
    SELECT
      tanggal,
      kanal,
      sku,
      SUM(qty) AS qty,
      SUM(revenue) AS revenue
    FROM transaction_items
    GROUP BY tanggal, kanal, sku;

    CREATE VIEW v_harga_terbaru AS
    SELECT
      h.jenis_harga,
      h.sku,
      h.harga
    FROM product_price_history h
    JOIN (
      SELECT jenis_harga, sku, MAX(bulan) AS bulan
      FROM product_price_history
      GROUP BY jenis_harga, sku
    ) m
      ON m.jenis_harga = h.jenis_harga
      AND m.sku = h.sku
      AND m.bulan = h.bulan;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
        DROP VIEW IF EXISTS v_harga_terbaru;
    DROP VIEW IF EXISTS v_penjualan_harian;
    DROP VIEW IF EXISTS v_stok_saat_ini;
  `);
};
