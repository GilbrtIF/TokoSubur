const db = require('../config/db');
const { escapeLikePattern } = require('../utils/format');

const findModelRuns = async () => {
  const { rows } = await db.query(`
    SELECT mr.*, (SELECT COUNT(*) FROM forecasts f WHERE f.run_id = mr.run_id)::int AS jumlah_prediksi
    FROM model_runs mr
    ORDER BY mr.aktif DESC, mr.run_id DESC
  `);
  return rows;
};

const findActiveModel = async () => {
  const { rows } = await db.query(
    'SELECT * FROM v_keyakinan_model ORDER BY run_id DESC LIMIT 1'
  );
  return rows[0] || null;
};

const findModelRun = async (runId) => {
  const { rows } = await db.query(
    'SELECT * FROM model_runs WHERE run_id = $1',
    [runId]
  );
  return rows[0] || null;
};

const buildForecastFilter = ({ runId, sku, kanal, from, to, granularitas }) => {
  const params = [];
  const conditions = [];
  if (runId) {
    params.push(runId);
    conditions.push(`f.run_id = $${params.length}`);
  } else {
    conditions.push('mr.aktif = TRUE');
  }
  if (sku) {
    params.push(sku);
    conditions.push(`f.sku = $${params.length}`);
  }
  if (kanal) {
    params.push(kanal);
    conditions.push(`LOWER(f.kanal) = LOWER($${params.length})`);
  }
  if (from) {
    params.push(from);
    conditions.push(`f.periode >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`f.periode <= $${params.length}`);
  }
  if (granularitas) {
    params.push(granularitas);
    conditions.push(`f.granularitas = $${params.length}`);
  }
  return { params, where: `WHERE ${conditions.join(' AND ')}` };
};

const findForecasts = async (filter) => {
  const { params, where } = buildForecastFilter(filter);
  params.push(filter.limit, filter.offset);
  const { rows } = await db.query(
    `
      SELECT f.*, p.nama, p.satuan_stok, mr.nama_model, mr.versi_model
      FROM forecasts f
      JOIN model_runs mr ON mr.run_id = f.run_id
      JOIN products p ON p.sku = f.sku
      ${where}
      ORDER BY f.sku ASC, f.periode ASC, f.kanal ASC NULLS FIRST
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const countForecasts = async (filter) => {
  const { params, where } = buildForecastFilter(filter);
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM forecasts f JOIN model_runs mr ON mr.run_id = f.run_id ${where}`,
    params
  );
  return rows[0].total;
};

const findDemandChanges = async ({ search, direction, limit, offset }) => {
  const params = [];
  const conditions = [];
  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    conditions.push(
      `(sku ILIKE $${params.length} ESCAPE '\\' OR nama ILIKE $${params.length} ESCAPE '\\')`
    );
  }
  if (direction === 'naik') {
    conditions.push('selisih_qty > 0');
  } else if (direction === 'turun') {
    conditions.push('selisih_qty < 0');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countParams = [...params];
  params.push(limit, offset);
  const [{ rows }, count] = await Promise.all([
    db.query(
      `
        SELECT * FROM v_perubahan_permintaan
        ${where}
        ORDER BY ABS(COALESCE(persentase_perubahan, 0)) DESC, ABS(selisih_qty) DESC, sku ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM v_perubahan_permintaan ${where}`,
      countParams
    ),
  ]);
  return { rows, total: count.rows[0].total };
};

const findStockProjection = async ({ search, maxHari, limit, offset }) => {
  const params = [];
  const conditions = [];
  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    conditions.push(
      `(sku ILIKE $${params.length} ESCAPE '\\' OR nama ILIKE $${params.length} ESCAPE '\\')`
    );
  }
  if (maxHari !== null && maxHari !== undefined) {
    params.push(maxHari);
    conditions.push(`estimasi_hari_habis <= $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countParams = [...params];
  params.push(limit, offset);
  const [{ rows }, count] = await Promise.all([
    db.query(
      `
        SELECT * FROM v_proyeksi_stok
        ${where}
        ORDER BY estimasi_hari_habis ASC NULLS LAST, sku ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM v_proyeksi_stok ${where}`,
      countParams
    ),
  ]);
  return { rows, total: count.rows[0].total };
};

const findActualSales = async ({ sku, from, to }) => {
  const { rows } = await db.query(
    `
      SELECT tanggal::text AS tanggal, SUM(qty)::numeric AS qty, SUM(revenue) AS revenue
      FROM v_penjualan_harian
      WHERE sku = $1 AND tanggal BETWEEN $2 AND $3
      GROUP BY tanggal
      ORDER BY tanggal
    `,
    [sku, from, to]
  );
  return rows;
};

const findProduct = async (sku) => {
  const { rows } = await db.query(
    `
      SELECT p.sku, p.nama, p.satuan_stok, p.is_active, COALESCE(st.stok, 0) AS stok
      FROM products p
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      WHERE p.sku = $1
    `,
    [sku]
  );
  return rows[0] || null;
};

const findExistingSkus = async (skus) => {
  const { rows } = await db.query(
    'SELECT sku FROM products WHERE sku = ANY($1::varchar[])',
    [skus]
  );
  return rows.map((row) => row.sku);
};

const findExistingKanal = async () => {
  const { rows } = await db.query('SELECT kanal FROM channels');
  return rows.map((row) => row.kanal);
};

const createModelRun = async (run) => {
  const { rows } = await db.query(
    `
      INSERT INTO model_runs (
        nama_model, versi_model, dilatih_pada, train_mulai, train_selesai,
        test_mulai, test_selesai, wape, mape, rmse, aktif
      )
      VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP), $4, $5, $6, $7, $8, $9, $10, FALSE)
      RETURNING *
    `,
    [
      run.namaModel,
      run.versiModel,
      run.dilatihPada,
      run.trainMulai,
      run.trainSelesai,
      run.testMulai,
      run.testSelesai,
      run.wape,
      run.mape,
      run.rmse,
    ]
  );
  return rows[0];
};

const insertForecasts = async (runId, items) => {
  if (items.length === 0) {
    return 0;
  }
  const values = [];
  const placeholders = items.map((item) => {
    values.push(
      runId,
      item.sku,
      item.kanal,
      item.periode,
      item.granularitas,
      item.qtyPrediksi,
      item.qtyBawah,
      item.qtyAtas
    );
    const base = values.length - 8;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, CURRENT_TIMESTAMP)`;
  });
  const result = await db.query(
    `
      INSERT INTO forecasts (run_id, sku, kanal, periode, granularitas, qty_prediksi, qty_bawah, qty_atas, dibuat_pada)
      VALUES ${placeholders.join(', ')}
    `,
    values
  );
  return result.rowCount;
};

const activateModelRun = async (runId) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE model_runs SET aktif = FALSE WHERE aktif = TRUE AND run_id <> $1',
      [runId]
    );
    const { rows } = await client.query(
      'UPDATE model_runs SET aktif = TRUE WHERE run_id = $1 RETURNING *',
      [runId]
    );
    await client.query('COMMIT');
    return rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Dataset latih = isi view v_dataset_latih, tetapi is_stockout dihitung sekali jalan.
 *
 * View aslinya memakai subquery berkorelasi per baris penjualan (±25 detik untuk
 * 41 ribu baris). Query ini memakai rumus yang sama -- saldo akhir hari terakhir
 * pada/sebelum tanggal penjualan <= 0 -- lewat window function (±0,3 detik).
 * Hasilnya sudah diverifikasi identik dengan view (EXCEPT ALL dua arah = 0 baris).
 * View tidak diubah karena Schema Freeze.
 */
const findTrainingDataset = async ({ from, to, maxRows }) => {
  const params = [];
  const conditions = [
    '(b.tanggal_batas IS NULL OR vp.tanggal <= b.tanggal_batas)',
  ];
  if (from) {
    params.push(from);
    conditions.push(`vp.tanggal >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`vp.tanggal <= $${params.length}`);
  }
  params.push(maxRows);

  const { rows } = await db.query(
    `
      WITH batas AS (
        SELECT MIN(ds.data_complete_until) AS tanggal_batas
        FROM data_status ds
        JOIN channels c ON c.kanal = ds.kanal
      ),
      penjualan AS (
        SELECT vp.tanggal, vp.kanal, vp.sku, vp.qty, vp.revenue
        FROM v_penjualan_harian vp
        CROSS JOIN batas b
        WHERE ${conditions.join(' AND ')}
      ),
      saldo AS (
        SELECT
          sku,
          tanggal,
          SUM(SUM(qty)) OVER (
            PARTITION BY sku ORDER BY tanggal
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS saldo_akhir_hari
        FROM stock_movements
        GROUP BY sku, tanggal
      ),
      gabung AS (
        SELECT sku, tanggal, 0 AS urutan, saldo_akhir_hari,
               NULL::varchar AS kanal, NULL::numeric AS qty, NULL::numeric AS revenue
        FROM saldo
        UNION ALL
        SELECT sku, tanggal, 1, NULL, kanal, qty, revenue
        FROM penjualan
      ),
      berkelompok AS (
        SELECT *,
          COUNT(saldo_akhir_hari) OVER (
            PARTITION BY sku ORDER BY tanggal, urutan ROWS UNBOUNDED PRECEDING
          ) AS grp
        FROM gabung
      ),
      terisi AS (
        SELECT *, MAX(saldo_akhir_hari) OVER (PARTITION BY sku, grp) AS saldo_terakhir
        FROM berkelompok
      )
      SELECT
        tanggal::text AS tanggal,
        kanal,
        sku,
        qty,
        revenue,
        COALESCE(saldo_terakhir <= 0, FALSE) AS is_stockout
      FROM terisi
      WHERE urutan = 1
      ORDER BY tanggal, kanal, sku
      LIMIT $${params.length}
    `,
    params
  );
  return rows;
};

module.exports = {
  findModelRuns,
  findActiveModel,
  findModelRun,
  findForecasts,
  countForecasts,
  findDemandChanges,
  findStockProjection,
  findActualSales,
  findProduct,
  findExistingSkus,
  findExistingKanal,
  createModelRun,
  insertForecasts,
  activateModelRun,
  findTrainingDataset,
};
