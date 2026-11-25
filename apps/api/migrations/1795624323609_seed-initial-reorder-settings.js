'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    WITH rentang_data AS (
      SELECT GREATEST((MAX(tanggal) - MIN(tanggal)) + 1, 1) AS total_hari
      FROM transaction_items
    ),
    permintaan_harian_sku AS (
      SELECT
        ti.sku,
        SUM(ti.qty)::NUMERIC / rd.total_hari AS avg_qty_harian
      FROM transaction_items ti
      CROSS JOIN rentang_data rd
      GROUP BY ti.sku, rd.total_hari
    )
    INSERT INTO reorder_settings (
      sku,
      stok_minimum_manual,
      titik_pesan_ulang,
      stok_pengaman,
      lead_time_hari,
      sumber_lead_time,
      level_layanan,
      diperbarui_pada
    )
    SELECT
      p.sku,
      NULL AS stok_minimum_manual,
      GREATEST(
        CEIL(
          CASE
            WHEN p.is_induk_pemecahan = TRUE THEN COALESCE((
              SELECT SUM(COALESCE(ph.avg_qty_harian, 0) * COALESCE(c.faktor_ke_induk, 0))
              FROM products c
              LEFT JOIN permintaan_harian_sku ph ON ph.sku = c.sku
              WHERE c.sku_induk = p.sku
            ), 0)
            ELSE COALESCE((
              SELECT ph.avg_qty_harian
              FROM permintaan_harian_sku ph
              WHERE ph.sku = p.sku
            ), 0)
          END * COALESCE(s.lead_time_hari, 7) + 2
        ),
        2
      ) AS titik_pesan_ulang,
      2 AS stok_pengaman,
      COALESCE(s.lead_time_hari, 7) AS lead_time_hari,
      'ASUMSI' AS sumber_lead_time,
      0.950 AS level_layanan,
      CURRENT_TIMESTAMP AS diperbarui_pada
    FROM products p
    LEFT JOIN suppliers s ON s.supplier_code = p.supplier_utama
    ON CONFLICT (sku) DO NOTHING;

    GRANT SELECT, INSERT, UPDATE, DELETE ON reorder_settings TO tokosubur_app;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM reorder_settings
    WHERE stok_minimum_manual IS NULL
      AND sumber_lead_time = 'ASUMSI';
  `);
};
