const db = require('../config/db');

const GRANULARITY_SQL = {
  harian: { unit: 'day', step: '1 day' },
  mingguan: { unit: 'week', step: '1 week' },
  bulanan: { unit: 'month', step: '1 month' },
};

/**
 * Filter dasar untuk transaction_items (alias ti) + products (alias p).
 * Parameter $1 = from, $2 = to selalu ada; kanal & kategori opsional.
 */
const buildItemFilter = ({ from, to, kanal, kategori }) => {
  const params = [from, to];
  const conditions = ['ti.tanggal BETWEEN $1 AND $2'];
  if (kanal) {
    params.push(kanal);
    conditions.push(`LOWER(ti.kanal) = LOWER($${params.length})`);
  }
  if (kategori) {
    params.push(kategori);
    conditions.push(`LOWER(p.kategori) = LOWER($${params.length})`);
  }
  return { params, where: conditions.join(' AND ') };
};

const getDataRange = async () => {
  const { rows } = await db.query(`
    SELECT MIN(tanggal) AS tanggal_awal, MAX(tanggal) AS tanggal_akhir
    FROM transaction_items
  `);
  return rows[0];
};

const getSalesTotals = async (filter) => {
  const { params, where } = buildItemFilter(filter);
  const { rows } = await db.query(
    `
      SELECT
        COALESCE(SUM(ti.revenue), 0) AS revenue,
        COALESCE(SUM(ti.qty), 0)::int AS qty,
        COUNT(DISTINCT ti.transaction_id)::int AS transaksi,
        COUNT(DISTINCT ti.sku)::int AS sku_terjual
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      WHERE ${where}
    `,
    params
  );
  return rows[0];
};

const getSalesSeries = async (filter, granularity) => {
  const { unit, step } = GRANULARITY_SQL[granularity];
  const { params, where } = buildItemFilter(filter);
  params.push(unit, step);
  const unitParam = `$${params.length - 1}`;
  const stepParam = `$${params.length}`;

  const { rows } = await db.query(
    `
      WITH periods AS (
        SELECT generate_series(
          date_trunc(${unitParam}, $1::date),
          date_trunc(${unitParam}, $2::date),
          ${stepParam}::interval
        )::date AS periode
      ),
      sales AS (
        SELECT
          date_trunc(${unitParam}, ti.tanggal)::date AS periode,
          SUM(ti.revenue) AS revenue,
          SUM(ti.qty) AS qty,
          COUNT(DISTINCT ti.transaction_id) AS transaksi
        FROM transaction_items ti
        JOIN products p ON p.sku = ti.sku
        WHERE ${where}
        GROUP BY 1
      )
      SELECT
        pr.periode::text AS periode,
        COALESCE(s.revenue, 0) AS revenue,
        COALESCE(s.qty, 0)::int AS qty,
        COALESCE(s.transaksi, 0)::int AS transaksi
      FROM periods pr
      LEFT JOIN sales s ON s.periode = pr.periode
      ORDER BY pr.periode ASC
    `,
    params
  );
  return rows;
};

const getSalesSeriesByChannel = async (filter, granularity) => {
  const { unit } = GRANULARITY_SQL[granularity];
  const { params, where } = buildItemFilter(filter);
  params.push(unit);

  const { rows } = await db.query(
    `
      SELECT
        date_trunc($${params.length}, ti.tanggal)::date::text AS periode,
        ti.kanal,
        SUM(ti.revenue) AS revenue,
        SUM(ti.qty)::int AS qty
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      WHERE ${where}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `,
    params
  );
  return rows;
};

const getSalesByChannel = async (filter) => {
  const { params, where } = buildItemFilter(filter);
  const { rows } = await db.query(
    `
      SELECT
        ti.kanal,
        c.jenis,
        SUM(ti.revenue) AS revenue,
        SUM(ti.qty)::int AS qty,
        COUNT(DISTINCT ti.transaction_id)::int AS transaksi
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      JOIN channels c ON c.kanal = ti.kanal
      WHERE ${where}
      GROUP BY ti.kanal, c.jenis
      ORDER BY revenue DESC
    `,
    params
  );
  return rows;
};

const getSalesByCategory = async (filter) => {
  const { params, where } = buildItemFilter(filter);
  const { rows } = await db.query(
    `
      SELECT
        COALESCE(p.kategori, 'Tanpa Kategori') AS kategori,
        SUM(ti.revenue) AS revenue,
        SUM(ti.qty)::int AS qty
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      WHERE ${where}
      GROUP BY 1
      ORDER BY revenue DESC
    `,
    params
  );
  return rows;
};

const getTopProducts = async (filter, { limit, sortBy }) => {
  const { params, where } = buildItemFilter(filter);
  params.push(limit);
  const orderColumn = sortBy === 'qty' ? 'qty' : 'revenue';

  const { rows } = await db.query(
    `
      SELECT
        ti.sku,
        p.nama,
        p.kategori,
        p.satuan_stok,
        SUM(ti.revenue) AS revenue,
        SUM(ti.qty)::int AS qty,
        COUNT(DISTINCT ti.transaction_id)::int AS transaksi
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      WHERE ${where}
      GROUP BY ti.sku, p.nama, p.kategori, p.satuan_stok
      ORDER BY ${orderColumn} DESC, ti.sku ASC
      LIMIT $${params.length}
    `,
    params
  );
  return rows;
};

const getExportRows = async (filter, maxRows) => {
  const { params, where } = buildItemFilter(filter);
  params.push(maxRows);
  const { rows } = await db.query(
    `
      SELECT
        ti.tanggal::text AS tanggal,
        ti.transaction_id,
        ti.kanal,
        ti.sku,
        p.nama,
        p.kategori,
        ti.qty,
        ti.harga_satuan,
        ti.diskon_rp,
        ti.revenue
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      WHERE ${where}
      ORDER BY ti.tanggal ASC, ti.transaction_id ASC, ti.item_id ASC
      LIMIT $${params.length}
    `,
    params
  );
  return rows;
};

const buildMetricFilter = ({ periode, kanal, sku }) => {
  const params = [];
  const conditions = [];
  if (periode) {
    params.push(periode);
    conditions.push(`mm.periode = $${params.length}`);
  }
  if (kanal) {
    params.push(kanal);
    conditions.push(`LOWER(mm.kanal) = LOWER($${params.length})`);
  }
  if (sku) {
    params.push(sku);
    conditions.push(`mm.sku = $${params.length}`);
  }
  return {
    params,
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
  };
};

const findMarketplaceMetrics = async (filter) => {
  const { params, where } = buildMetricFilter(filter);
  params.push(filter.limit, filter.offset);
  const { rows } = await db.query(
    `
      SELECT mm.*, p.nama
      FROM marketplace_metrics mm
      JOIN products p ON p.sku = mm.sku
      ${where}
      ORDER BY mm.periode DESC, mm.impresi DESC NULLS LAST, mm.sku ASC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const summarizeMarketplaceMetrics = async (filter) => {
  const { params, where } = buildMetricFilter(filter);
  const { rows } = await db.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(mm.impresi), 0)::bigint AS impresi,
        COALESCE(SUM(mm.klik), 0)::bigint AS klik,
        COALESCE(SUM(mm.pesanan), 0)::bigint AS pesanan
      FROM marketplace_metrics mm
      ${where}
    `,
    params
  );
  return rows[0];
};

module.exports = {
  GRANULARITY_SQL,
  getDataRange,
  getSalesTotals,
  getSalesSeries,
  getSalesSeriesByChannel,
  getSalesByChannel,
  getSalesByCategory,
  getTopProducts,
  getExportRows,
  findMarketplaceMetrics,
  summarizeMarketplaceMetrics,
};
