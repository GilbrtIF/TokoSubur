'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    -- 1. Kartu Stok (riwayat mutasi beserta saldo berjalan per SKU)
    CREATE VIEW v_kartu_stok AS
    SELECT
      sm.movement_id,
      sm.tanggal,
      sm.order_date,
      sm.sku,
      p.nama AS nama_produk,
      p.satuan_stok,
      p.is_active,
      sm.jenis,
      smt.arah,
      smt.keterangan AS keterangan_jenis,
      sm.qty,
      SUM(sm.qty) OVER (
        PARTITION BY sm.sku
        ORDER BY sm.tanggal ASC, sm.movement_id ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS saldo_berjalan,
      sm.ref,
      sm.sumber,
      sm.batch_id
    FROM stock_movements sm
    JOIN products p ON p.sku = sm.sku
    JOIN stock_movement_types smt ON smt.jenis = sm.jenis;

    -- 2. Ketersediaan Paket (stok paket jadi & kapasitas rakit dari komponen aktif)
    CREATE VIEW v_ketersediaan_paket AS
    SELECT
      p.sku AS sku_paket,
      p.nama AS nama_paket,
      p.satuan_stok,
      COALESCE(sp.stok, 0) AS stok_paket_jadi,
      COALESCE(
        FLOOR(
          MIN(
            GREATEST(COALESCE(sk.stok, 0), 0) / NULLIF(bc.qty_komponen_per_paket, 0)
          )
        ),
        0
      )::INT AS maks_paket_bisa_dirakit,
      (COALESCE(sp.stok, 0) <= 2) AS perlu_dirakit
    FROM products p
    LEFT JOIN v_stok_saat_ini sp ON sp.sku = p.sku
    LEFT JOIN bundle_components bc ON bc.sku_paket = p.sku
    LEFT JOIN v_stok_saat_ini sk ON sk.sku = bc.sku_komponen
    WHERE p.is_bundle = TRUE
      AND p.is_active = TRUE
    GROUP BY p.sku, p.nama, p.satuan_stok, sp.stok;

    -- 3. Saran Pemecahan (kemasan aktif di bawah ambang minimum & stok induk mencukupi)
    CREATE VIEW v_saran_pemecahan AS
    WITH perhitungan AS (
      SELECT
        p.sku,
        p.nama AS nama_produk,
        p.satuan_stok,
        COALESCE(sc.stok, 0) AS stok_kemasan_saat_ini,
        COALESCE(rs.stok_minimum_manual, rs.titik_pesan_ulang, rs.stok_pengaman, 2) AS ambang_pemecahan,
        p.sku_induk,
        induk.nama AS nama_induk,
        induk.satuan_stok AS satuan_stok_induk,
        COALESCE(sp.stok, 0) AS stok_induk_saat_ini,
        p.faktor_ke_induk,
        FLOOR(COALESCE(sp.stok, 0) / NULLIF(p.faktor_ke_induk, 0)) AS maks_kemasan_dari_induk,
        GREATEST(
          CEIL(COALESCE(rs.stok_minimum_manual, rs.titik_pesan_ulang, rs.stok_pengaman, 2) - COALESCE(sc.stok, 0) + 1),
          1
        ) AS kebutuhan_kemasan
      FROM products p
      JOIN products induk ON induk.sku = p.sku_induk
      LEFT JOIN v_stok_saat_ini sc ON sc.sku = p.sku
      LEFT JOIN v_stok_saat_ini sp ON sp.sku = p.sku_induk
      LEFT JOIN reorder_settings rs ON rs.sku = p.sku
      WHERE p.is_active = TRUE
        AND induk.is_active = TRUE
        AND p.sku_induk IS NOT NULL
        AND p.faktor_ke_induk IS NOT NULL
        AND p.faktor_ke_induk > 0
    )
    SELECT
      sku,
      nama_produk,
      satuan_stok,
      stok_kemasan_saat_ini,
      ambang_pemecahan,
      sku_induk,
      nama_induk,
      satuan_stok_induk,
      stok_induk_saat_ini,
      faktor_ke_induk,
      LEAST(maks_kemasan_dari_induk, kebutuhan_kemasan)::INT AS saran_qty_kemasan,
      ROUND((LEAST(maks_kemasan_dari_induk, kebutuhan_kemasan) * faktor_ke_induk)::NUMERIC, 4) AS saran_qty_induk,
      CASE
        WHEN maks_kemasan_dari_induk >= 1 THEN 'CUKUP'
        ELSE 'STOK_INDUK_KURANG'
      END AS status_induk
    FROM perhitungan
    WHERE stok_kemasan_saat_ini < ambang_pemecahan;

    -- 4. Rekomendasi Restok (produk aktif & konversi kebutuhan ke satuan beli supplier)
    CREATE VIEW v_rekomendasi_restok AS
    WITH active_forecast_sku AS (
      SELECT
        f.sku,
        SUM(f.qty_prediksi) AS total_prediksi_qty
      FROM forecasts f
      JOIN model_runs mr ON mr.run_id = f.run_id
      WHERE mr.aktif = TRUE
        AND f.periode >= CURRENT_DATE
        AND f.periode < CURRENT_DATE + INTERVAL '30 days'
      GROUP BY f.sku
    ),
    kebutuhan_induk AS (
      SELECT
        p.sku,
        p.nama,
        p.kategori,
        p.satuan_stok,
        p.satuan_beli,
        COALESCE(p.isi_per_pembelian, CASE WHEN p.satuan_stok = 'kg' THEN 50 ELSE 10 END) AS isi_per_pembelian,
        p.supplier_utama,
        s.nama_supplier,
        COALESCE(rs.lead_time_hari, s.lead_time_hari, 7) AS lead_time_hari,
        COALESCE(st.stok, 0) AS stok_saat_ini,
        COALESCE(rs.stok_pengaman, 2) AS stok_pengaman,
        COALESCE(rs.titik_pesan_ulang, rs.stok_minimum_manual, rs.stok_pengaman, 2) AS titik_pesan_ulang,
        CASE
          WHEN p.is_induk_pemecahan = TRUE THEN COALESCE((
            SELECT SUM(COALESCE(af.total_prediksi_qty, 0) * COALESCE(c.faktor_ke_induk, 0))
            FROM products c
            LEFT JOIN active_forecast_sku af ON af.sku = c.sku
            WHERE c.sku_induk = p.sku
              AND c.is_active = TRUE
          ), 0)
          ELSE COALESCE((
            SELECT af.total_prediksi_qty
            FROM active_forecast_sku af
            WHERE af.sku = p.sku
          ), 0)
        END AS prediksi_kebutuhan_30_hari
      FROM products p
      LEFT JOIN suppliers s ON s.supplier_code = p.supplier_utama
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      LEFT JOIN reorder_settings rs ON rs.sku = p.sku
      WHERE p.is_active = TRUE
        AND p.sku_induk IS NULL
        AND p.is_bundle = FALSE
    )
    SELECT
      sku,
      nama,
      kategori,
      satuan_stok,
      satuan_beli,
      isi_per_pembelian,
      supplier_utama,
      nama_supplier,
      lead_time_hari,
      stok_saat_ini,
      stok_pengaman,
      titik_pesan_ulang,
      ROUND(prediksi_kebutuhan_30_hari::NUMERIC, 2) AS prediksi_kebutuhan_30_hari,
      GREATEST(
        ROUND(((prediksi_kebutuhan_30_hari + stok_pengaman) - stok_saat_ini)::NUMERIC, 2),
        0
      ) AS selisih_kebutuhan_stok,
      CASE
        WHEN GREATEST((prediksi_kebutuhan_30_hari + stok_pengaman) - stok_saat_ini, 0) > 0 THEN
          GREATEST(
            CEIL(
              GREATEST((prediksi_kebutuhan_30_hari + stok_pengaman) - stok_saat_ini, 0)
              / NULLIF(isi_per_pembelian, 0)
            ),
            CASE WHEN satuan_stok = 'unit' THEN 10 ELSE 1 END
          )::INT
        WHEN stok_saat_ini <= titik_pesan_ulang THEN
          CASE WHEN satuan_stok = 'unit' THEN 10 ELSE 1 END
        ELSE 0
      END AS saran_jumlah_beli
    FROM kebutuhan_induk
    WHERE stok_saat_ini <= titik_pesan_ulang
       OR (prediksi_kebutuhan_30_hari + stok_pengaman) > stok_saat_ini;

    GRANT SELECT ON v_kartu_stok, v_ketersediaan_paket, v_saran_pemecahan, v_rekomendasi_restok TO tokosubur_app;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_rekomendasi_restok;
    DROP VIEW IF EXISTS v_saran_pemecahan;
    DROP VIEW IF EXISTS v_ketersediaan_paket;
    DROP VIEW IF EXISTS v_kartu_stok;
  `);
};
