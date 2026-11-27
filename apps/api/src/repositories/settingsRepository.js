const db = require('../config/db');
const { escapeLikePattern } = require('../utils/format');

const buildFilter = ({ search, kategori, skus }) => {
  const params = [];
  const conditions = ['p.is_active = TRUE'];
  if (skus) {
    params.push(skus);
    conditions.push(`p.sku = ANY($${params.length}::varchar[])`);
  }
  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    conditions.push(
      `(p.sku ILIKE $${params.length} ESCAPE '\\' OR p.nama ILIKE $${params.length} ESCAPE '\\')`
    );
  }
  if (kategori) {
    params.push(kategori);
    conditions.push(`LOWER(p.kategori) = LOWER($${params.length})`);
  }
  return { params, where: conditions.join(' AND ') };
};

const findReorderSettings = async (filter) => {
  const { params, where } = buildFilter(filter);
  params.push(filter.limit, filter.offset);
  const { rows } = await db.query(
    `
      SELECT
        p.sku,
        p.nama,
        p.kategori,
        p.satuan_stok,
        p.supplier_utama,
        COALESCE(st.stok, 0) AS stok_saat_ini,
        rs.stok_minimum_manual,
        rs.titik_pesan_ulang,
        rs.stok_pengaman,
        rs.lead_time_hari,
        rs.sumber_lead_time,
        rs.level_layanan,
        rs.diperbarui_pada,
        COALESCE(rs.stok_minimum_manual, rs.titik_pesan_ulang, rs.stok_pengaman, 2) AS ambang_efektif
      FROM products p
      LEFT JOIN reorder_settings rs ON rs.sku = p.sku
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      WHERE ${where}
      ORDER BY p.product_id ASC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const countReorderSettings = async (filter) => {
  const { params, where } = buildFilter(filter);
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM products p WHERE ${where}`,
    params
  );
  return rows[0].total;
};

const findActiveSkus = async (skus) => {
  const { rows } = await db.query(
    'SELECT sku, is_active FROM products WHERE sku = ANY($1::varchar[])',
    [skus]
  );
  return rows;
};

/**
 * Upsert pengaturan stok minimum. Field undefined tidak diubah, null mengosongkan.
 */
const upsertReorderSettings = async (items) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await items.reduce(async (previous, item) => {
      await previous;
      const has = (key) => item[key] !== undefined;
      await client.query(
        `
          INSERT INTO reorder_settings (
            sku, stok_minimum_manual, titik_pesan_ulang, stok_pengaman,
            lead_time_hari, sumber_lead_time, level_layanan, diperbarui_pada
          )
          VALUES ($1, $2, COALESCE($3, 2), COALESCE($4, 2), COALESCE($5, 7),
                  CASE WHEN $9 THEN 'MANUAL' ELSE 'ASUMSI' END, 0.950, CURRENT_TIMESTAMP)
          ON CONFLICT (sku) DO UPDATE SET
            stok_minimum_manual = CASE WHEN $6 THEN EXCLUDED.stok_minimum_manual ELSE reorder_settings.stok_minimum_manual END,
            titik_pesan_ulang   = CASE WHEN $7 THEN EXCLUDED.titik_pesan_ulang ELSE reorder_settings.titik_pesan_ulang END,
            stok_pengaman       = CASE WHEN $8 THEN EXCLUDED.stok_pengaman ELSE reorder_settings.stok_pengaman END,
            lead_time_hari      = CASE WHEN $9 THEN EXCLUDED.lead_time_hari ELSE reorder_settings.lead_time_hari END,
            sumber_lead_time    = CASE WHEN $9 THEN 'MANUAL' ELSE reorder_settings.sumber_lead_time END,
            diperbarui_pada     = CURRENT_TIMESTAMP
        `,
        [
          item.sku,
          has('stokMinimumManual') ? item.stokMinimumManual : null,
          has('titikPesanUlang') ? item.titikPesanUlang : null,
          has('stokPengaman') ? item.stokPengaman : null,
          has('leadTimeHari') ? item.leadTimeHari : null,
          has('stokMinimumManual'),
          has('titikPesanUlang'),
          has('stokPengaman'),
          has('leadTimeHari'),
        ]
      );
    }, Promise.resolve());
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findReorderSettings,
  countReorderSettings,
  findActiveSkus,
  upsertReorderSettings,
};
