const db = require('../config/db');

// Mutasi manual memakai ref "BATCH-<tanggal>-<token>-<urutan>"; kunci event = ref tanpa urutan.
const MANUAL_KEY_SQL = "regexp_replace(ref, '-[0-9]+$', '')";

const EVENTS_CTE = `
  WITH events AS (
    SELECT
      'opname'::text AS tipe,
      tanggal,
      COALESCE(berkas, '') AS kunci,
      NULL::timestamp AS waktu,
      COUNT(*)::int AS jumlah_item,
      COUNT(*) FILTER (WHERE selisih IS NOT NULL AND selisih <> 0)::int AS jumlah_selisih,
      MAX(berkas) AS berkas,
      NULL::int AS batch_id,
      NULL::text AS diimpor_oleh
    FROM stock_opname
    GROUP BY tanggal, COALESCE(berkas, '')
    UNION ALL
    SELECT
      'import',
      COALESCE(diimpor_pada::date, periode_mulai),
      batch_id::text,
      diimpor_pada,
      baris_baru,
      0,
      nama_berkas,
      batch_id,
      diimpor_oleh
    FROM import_batches
    WHERE jenis_impor = 'stok'
    UNION ALL
    SELECT
      'manual',
      MIN(tanggal),
      ${MANUAL_KEY_SQL},
      NULL::timestamp,
      COUNT(*)::int,
      0,
      NULL,
      NULL,
      NULL
    FROM stock_movements
    WHERE ref LIKE 'BATCH-%'
    GROUP BY ${MANUAL_KEY_SQL}
  )
`;

const buildFilter = ({ type, from, to }) => {
  const params = [];
  const conditions = [];
  if (type && type !== 'all') {
    params.push(type);
    conditions.push(`tipe = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`tanggal >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`tanggal <= $${params.length}`);
  }
  return {
    params,
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
  };
};

const findEvents = async (filter) => {
  const { params, where } = buildFilter(filter);
  params.push(filter.limit, filter.offset);
  const { rows } = await db.query(
    `
      ${EVENTS_CTE}
      SELECT * FROM events
      ${where}
      ORDER BY tanggal DESC, waktu DESC NULLS LAST, kunci DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const countEvents = async (filter) => {
  const { params, where } = buildFilter(filter);
  const { rows } = await db.query(
    `${EVENTS_CTE} SELECT COUNT(*)::int AS total FROM events ${where}`,
    params
  );
  return rows[0].total;
};

const findOpnameItems = async (tanggal, berkasKey) => {
  const { rows } = await db.query(
    `
      SELECT so.sku, p.nama, so.stok_sistem, so.stok_fisik, so.selisih, so.satuan_stok,
             so.alasan_selisih, so.catatan
      FROM stock_opname so
      JOIN products p ON p.sku = so.sku
      WHERE so.tanggal = $1 AND COALESCE(so.berkas, '') = $2
      ORDER BY p.product_id
    `,
    [tanggal, berkasKey]
  );
  return rows;
};

const findMovementItems = async ({ batchId, manualKey }) => {
  const condition = batchId
    ? 'sm.batch_id = $1'
    : `sm.ref LIKE 'BATCH-%' AND ${MANUAL_KEY_SQL.replace('ref', 'sm.ref')} = $1`;
  const { rows } = await db.query(
    `
      SELECT sm.movement_id, sm.tanggal, sm.sku, p.nama, p.satuan_stok, sm.jenis, sm.qty, sm.sumber
      FROM stock_movements sm
      JOIN products p ON p.sku = sm.sku
      WHERE ${condition}
      ORDER BY sm.movement_id
    `,
    [batchId || manualKey]
  );
  return rows;
};

module.exports = {
  findEvents,
  countEvents,
  findOpnameItems,
  findMovementItems,
};
