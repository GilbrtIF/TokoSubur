const db = require('../config/db');
const { escapeLikePattern } = require('../utils/format');

const paginate = (params, limit, offset) => {
  params.push(limit, offset);
  return `LIMIT $${params.length - 1} OFFSET $${params.length}`;
};

const whereOf = (conditions) =>
  conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

const getChannelStatus = async () => {
  const { rows } = await db.query(`
    SELECT
      c.kanal,
      c.jenis,
      ds.periode_mulai,
      ds.data_complete_until,
      ds.catatan,
      (SELECT MAX(ti.tanggal) FROM transaction_items ti WHERE ti.kanal = c.kanal) AS transaksi_terakhir,
      (SELECT MAX(ib.diimpor_pada) FROM import_batches ib WHERE ib.kanal = c.kanal) AS import_terakhir
    FROM channels c
    LEFT JOIN data_status ds ON ds.kanal = c.kanal
    ORDER BY c.channel_id ASC
  `);
  return rows;
};

const getQualityCounts = async () => {
  const { rows } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM laporan_ditolak)::int AS total_ditolak,
      (SELECT COUNT(*) FROM penjualan_ambigu)::int AS total_ambigu,
      (SELECT COUNT(*) FROM product_mapping)::int AS total_mapping,
      (SELECT COUNT(*) FROM product_mapping WHERE status <> 'masuk')::int AS mapping_perlu_tinjau
  `);
  return rows[0];
};

const getRejectedByReason = async () => {
  const { rows } = await db.query(`
    SELECT jenis_alasan, COUNT(*)::int AS jumlah
    FROM laporan_ditolak
    GROUP BY jenis_alasan
    ORDER BY jumlah DESC
  `);
  return rows;
};

const getMappingByStatus = async () => {
  const { rows } = await db.query(`
    SELECT status, COUNT(*)::int AS jumlah, COALESCE(SUM(jumlah_baris), 0)::int AS jumlah_baris
    FROM product_mapping
    GROUP BY status
    ORDER BY status
  `);
  return rows;
};

const findImportBatches = async ({ jenisImpor, status, limit, offset }) => {
  const params = [];
  const conditions = [];
  if (jenisImpor) {
    params.push(jenisImpor);
    conditions.push(`jenis_impor = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = whereOf(conditions);
  const countParams = [...params];
  const page = paginate(params, limit, offset);

  const [{ rows }, count] = await Promise.all([
    db.query(
      `SELECT * FROM import_batches ${where} ORDER BY batch_id DESC ${page}`,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM import_batches ${where}`,
      countParams
    ),
  ]);
  return { rows, total: count.rows[0].total };
};

const findRejectedRows = async ({
  tahap,
  berkas,
  jenisAlasan,
  batchId,
  limit,
  offset,
}) => {
  const params = [];
  const conditions = [];
  if (tahap) {
    params.push(tahap);
    conditions.push(`tahap = $${params.length}`);
  }
  if (berkas) {
    params.push(`%${escapeLikePattern(berkas)}%`);
    conditions.push(`berkas ILIKE $${params.length} ESCAPE '\\'`);
  }
  if (jenisAlasan) {
    params.push(jenisAlasan);
    conditions.push(`jenis_alasan = $${params.length}`);
  }
  if (batchId) {
    params.push(batchId);
    conditions.push(`batch_id = $${params.length}`);
  }
  const where = whereOf(conditions);
  const countParams = [...params];
  const page = paginate(params, limit, offset);

  const [{ rows }, count] = await Promise.all([
    db.query(
      `SELECT * FROM laporan_ditolak ${where} ORDER BY batch_id DESC NULLS LAST, berkas, baris_excel ${page}`,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM laporan_ditolak ${where}`,
      countParams
    ),
  ]);
  return { rows, total: count.rows[0].total };
};

const findAmbiguousSales = async ({ kanal, from, to, limit, offset }) => {
  const params = [];
  const conditions = [];
  if (kanal) {
    params.push(kanal);
    conditions.push(`LOWER(kanal) = LOWER($${params.length})`);
  }
  if (from) {
    params.push(from);
    conditions.push(`tanggal >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`tanggal <= $${params.length}`);
  }
  const where = whereOf(conditions);
  const countParams = [...params];
  const page = paginate(params, limit, offset);

  const [{ rows }, count] = await Promise.all([
    db.query(
      `SELECT * FROM penjualan_ambigu ${where} ORDER BY tanggal DESC, berkas, baris_excel ${page}`,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(subtotal), 0) AS total_subtotal FROM penjualan_ambigu ${where}`,
      countParams
    ),
  ]);
  return {
    rows,
    total: count.rows[0].total,
    totalSubtotal: Number(count.rows[0].total_subtotal),
  };
};

const findProductMappings = async ({
  status,
  sumber,
  search,
  limit,
  offset,
}) => {
  const params = [];
  const conditions = [];
  if (status) {
    params.push(status);
    conditions.push(`pm.status = $${params.length}`);
  }
  if (sumber) {
    params.push(sumber);
    conditions.push(`pm.sumber = $${params.length}`);
  }
  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    conditions.push(
      `(pm.teks ILIKE $${params.length} ESCAPE '\\' OR pm.contoh_teks_asli ILIKE $${params.length} ESCAPE '\\' OR pm.sku_hasil ILIKE $${params.length} ESCAPE '\\')`
    );
  }
  const where = whereOf(conditions);
  const countParams = [...params];
  const page = paginate(params, limit, offset);

  const [{ rows }, count] = await Promise.all([
    db.query(
      `
        SELECT pm.*, p.nama AS nama_produk
        FROM product_mapping pm
        LEFT JOIN products p ON p.sku = pm.sku_hasil
        ${where}
        ORDER BY (pm.status = 'masuk') ASC, pm.jumlah_baris DESC, pm.teks ASC
        ${page}
      `,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM product_mapping pm ${where}`,
      countParams
    ),
  ]);
  return { rows, total: count.rows[0].total };
};

const findProduct = async (sku) => {
  const { rows } = await db.query(
    'SELECT sku, nama, is_active FROM products WHERE sku = $1',
    [sku]
  );
  return rows[0] || null;
};

/**
 * Simpan mapping teks -> SKU. Teks dibandingkan tanpa beda huruf besar/kecil & spasi tepi.
 */
const upsertProductMapping = async ({
  sumber,
  teks,
  contohTeksAsli,
  skuHasil,
  aturan,
}) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `
        UPDATE product_mapping
        SET sku_hasil = $3, aturan = $4, status = 'masuk',
            contoh_teks_asli = COALESCE(contoh_teks_asli, $5)
        WHERE sumber = $1 AND LOWER(TRIM(teks)) = $2
        RETURNING *
      `,
      [sumber, teks, skuHasil, aturan, contohTeksAsli]
    );

    let row;
    let created = false;
    if (updated.rowCount > 0) {
      [row] = updated.rows;
    } else {
      const inserted = await client.query(
        `
          INSERT INTO product_mapping (sumber, teks, contoh_teks_asli, jumlah_baris, baris_masuk, aturan, sku_hasil, status)
          VALUES ($1, $2, $3, 0, 0, $4, $5, 'masuk')
          RETURNING *
        `,
        [sumber, teks, contohTeksAsli, aturan, skuHasil]
      );
      [row] = inserted.rows;
      created = true;
    }
    await client.query('COMMIT');
    return { row, created };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getChannelStatus,
  getQualityCounts,
  getRejectedByReason,
  getMappingByStatus,
  findImportBatches,
  findRejectedRows,
  findAmbiguousSales,
  findProductMappings,
  findProduct,
  upsertProductMapping,
};
