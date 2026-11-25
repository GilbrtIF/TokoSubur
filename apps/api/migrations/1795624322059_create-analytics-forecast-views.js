'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    -- 5. Dataset Latih Model (dibatasi sampai tanggal terkecil data_complete_until + penanda stockout)
    CREATE VIEW v_dataset_latih AS
    WITH batas_lengkap AS (
      SELECT MIN(ds.data_complete_until) AS tanggal_batas
      FROM data_status ds
      JOIN channels c ON c.kanal = ds.kanal
    ),
    saldo_harian AS (
      SELECT
        sku,
        tanggal,
        SUM(qty) AS mutasi_harian,
        SUM(SUM(qty)) OVER (
          PARTITION BY sku
          ORDER BY tanggal ASC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS saldo_akhir_hari
      FROM stock_movements
      GROUP BY sku, tanggal
    )
    SELECT
      vp.tanggal,
      vp.kanal,
      vp.sku,
      vp.qty,
      vp.revenue,
      COALESCE((
        SELECT sh.saldo_akhir_hari <= 0
        FROM saldo_harian sh
        WHERE sh.sku = vp.sku
          AND sh.tanggal <= vp.tanggal
        ORDER BY sh.tanggal DESC
        LIMIT 1
      ), FALSE) AS is_stockout
    FROM v_penjualan_harian vp
    CROSS JOIN batas_lengkap bl
    WHERE bl.tanggal_batas IS NULL
       OR vp.tanggal <= bl.tanggal_batas;

    -- 6. Proyeksi Stok & Perkiraan Tanggal Habis (untuk kolom "Stok Cukup" di UI Inventory)
    CREATE VIEW v_proyeksi_stok AS
    WITH prediksi_harian AS (
      SELECT
        f.sku,
        AVG(
          CASE f.granularitas
            WHEN 'harian' THEN f.qty_prediksi
            WHEN 'mingguan' THEN f.qty_prediksi / 7.0
            WHEN 'bulanan' THEN f.qty_prediksi / 30.0
            ELSE f.qty_prediksi
          END
        ) AS rata_permintaan_harian,
        SUM(f.qty_prediksi) AS total_qty_prediksi
      FROM forecasts f
      JOIN model_runs mr ON mr.run_id = f.run_id
      WHERE mr.aktif = TRUE
      GROUP BY f.sku
    )
    SELECT
      p.sku,
      p.nama,
      p.satuan_stok,
      p.is_active,
      COALESCE(st.stok, 0) AS stok_saat_ini,
      ROUND(COALESCE(ph.rata_permintaan_harian, 0)::NUMERIC, 4) AS rata_permintaan_harian,
      ROUND(COALESCE(ph.total_qty_prediksi, 0)::NUMERIC, 2) AS total_qty_prediksi,
      CASE
        WHEN COALESCE(ph.rata_permintaan_harian, 0) > 0 AND COALESCE(st.stok, 0) > 0 THEN
          FLOOR(COALESCE(st.stok, 0) / ph.rata_permintaan_harian)::INT
        WHEN COALESCE(st.stok, 0) <= 0 THEN 0
        ELSE NULL
      END AS estimasi_hari_habis,
      CASE
        WHEN COALESCE(ph.rata_permintaan_harian, 0) > 0 AND COALESCE(st.stok, 0) > 0 THEN
          (CURRENT_DATE + FLOOR(COALESCE(st.stok, 0) / ph.rata_permintaan_harian)::INT)
        WHEN COALESCE(st.stok, 0) <= 0 THEN CURRENT_DATE
        ELSE NULL
      END AS perkiraan_tanggal_habis
    FROM products p
    LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
    LEFT JOIN prediksi_harian ph ON ph.sku = p.sku
    WHERE p.is_active = TRUE;

    -- 7. Perubahan Permintaan (Prediksi 30 hari vs Aktual 30 hari terakhir)
    CREATE VIEW v_perubahan_permintaan AS
    WITH tanggal_acuan AS (
      SELECT COALESCE(MAX(tanggal), CURRENT_DATE) AS tgl_akhir
      FROM transaction_items
    ),
    aktual_30_hari AS (
      SELECT
        ti.sku,
        SUM(ti.qty) AS qty_aktual_30_hari,
        SUM(ti.revenue) AS revenue_aktual_30_hari
      FROM transaction_items ti
      CROSS JOIN tanggal_acuan ta
      WHERE ti.tanggal > ta.tgl_akhir - INTERVAL '30 days'
        AND ti.tanggal <= ta.tgl_akhir
      GROUP BY ti.sku
    ),
    prediksi_30_hari AS (
      SELECT
        f.sku,
        SUM(f.qty_prediksi) AS qty_prediksi_30_hari
      FROM forecasts f
      JOIN model_runs mr ON mr.run_id = f.run_id
      CROSS JOIN tanggal_acuan ta
      WHERE mr.aktif = TRUE
        AND f.periode > ta.tgl_akhir
        AND f.periode <= ta.tgl_akhir + INTERVAL '30 days'
      GROUP BY f.sku
    )
    SELECT
      p.sku,
      p.nama,
      p.kategori,
      COALESCE(a.qty_aktual_30_hari, 0) AS qty_aktual_30_hari,
      COALESCE(a.revenue_aktual_30_hari, 0) AS revenue_aktual_30_hari,
      ROUND(COALESCE(pr.qty_prediksi_30_hari, 0)::NUMERIC, 2) AS qty_prediksi_30_hari,
      ROUND((COALESCE(pr.qty_prediksi_30_hari, 0) - COALESCE(a.qty_aktual_30_hari, 0))::NUMERIC, 2) AS selisih_qty,
      CASE
        WHEN COALESCE(a.qty_aktual_30_hari, 0) > 0 THEN
          ROUND(
            (((COALESCE(pr.qty_prediksi_30_hari, 0) - a.qty_aktual_30_hari) / a.qty_aktual_30_hari) * 100)::NUMERIC,
            2
          )
        ELSE NULL
      END AS persentase_perubahan
    FROM products p
    LEFT JOIN aktual_30_hari a ON a.sku = p.sku
    LEFT JOIN prediksi_30_hari pr ON pr.sku = p.sku
    WHERE p.is_sellable = TRUE
      AND p.is_active = TRUE;

    -- 8. Keyakinan Model Aktif
    CREATE VIEW v_keyakinan_model AS
    SELECT
      run_id,
      nama_model,
      versi_model,
      dilatih_pada,
      train_mulai,
      train_selesai,
      test_mulai,
      test_selesai,
      wape,
      mape,
      rmse,
      CASE
        WHEN wape IS NOT NULL THEN ROUND(GREATEST(100 - wape, 0)::NUMERIC, 2)
        ELSE NULL
      END AS estimasi_akurasi_persen,
      aktif
    FROM model_runs
    WHERE aktif = TRUE;

    GRANT SELECT ON v_dataset_latih, v_proyeksi_stok, v_perubahan_permintaan, v_keyakinan_model TO tokosubur_app;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_keyakinan_model;
    DROP VIEW IF EXISTS v_perubahan_permintaan;
    DROP VIEW IF EXISTS v_proyeksi_stok;
    DROP VIEW IF EXISTS v_dataset_latih;
  `);
};
