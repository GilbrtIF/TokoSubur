const db = require('../config/db');
const { escapeLikePattern, clipText } = require('../utils/format');

const buildListFilter = ({ from, to, kanal, search, sku }) => {
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`t.tanggal >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`t.tanggal <= $${params.length}`);
  }
  if (kanal) {
    params.push(kanal);
    conditions.push(`LOWER(t.kanal) = LOWER($${params.length})`);
  }
  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    conditions.push(`t.transaction_id ILIKE $${params.length} ESCAPE '\\'`);
  }
  if (sku) {
    params.push(sku);
    conditions.push(
      `EXISTS (SELECT 1 FROM transaction_items ti WHERE ti.transaction_id = t.transaction_id AND ti.sku = $${params.length})`
    );
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const findTransactions = async (filter) => {
  const { whereClause, params } = buildListFilter(filter);
  params.push(filter.limit, filter.offset);

  const { rows } = await db.query(
    `
      SELECT
        t.transaction_id,
        t.kanal,
        t.tanggal,
        t.jumlah_item,
        t.total_qty,
        t.total_revenue,
        t.order_no_generated,
        t.batch_id,
        (
          SELECT STRING_AGG(x.nama, ', ')
          FROM (
            SELECT p.nama
            FROM transaction_items ti
            JOIN products p ON p.sku = ti.sku
            WHERE ti.transaction_id = t.transaction_id
            ORDER BY ti.item_id
            LIMIT 3
          ) x
        ) AS ringkasan_produk
      FROM transactions t
      ${whereClause}
      ORDER BY t.tanggal DESC, t.transaction_id DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const summarizeTransactions = async (filter) => {
  const { whereClause, params } = buildListFilter(filter);
  const { rows } = await db.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(t.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(t.total_qty), 0)::int AS total_qty
      FROM transactions t
      ${whereClause}
    `,
    params
  );
  return rows[0];
};

const findTransactionById = async (transactionId) => {
  const { rows } = await db.query(
    `
      SELECT t.*, c.kode, c.jenis AS jenis_kanal
      FROM transactions t
      JOIN channels c ON c.kanal = t.kanal
      WHERE t.transaction_id = $1
    `,
    [transactionId]
  );
  return rows[0] || null;
};

const findTransactionItems = async (transactionId) => {
  const { rows } = await db.query(
    `
      SELECT
        ti.item_id,
        ti.sku,
        p.nama AS nama_produk,
        p.satuan_stok,
        ti.qty,
        ti.harga_satuan,
        ti.diskon_rp,
        ti.revenue,
        ti.berkas,
        ti.baris_excel,
        f.netto,
        f.komisi_platform,
        f.ongkir,
        f.laba_kotor,
        f.hpp_total,
        f.laba_bersih
      FROM transaction_items ti
      JOIN products p ON p.sku = ti.sku
      LEFT JOIN online_item_financials f ON f.item_id = ti.item_id
      WHERE ti.transaction_id = $1
      ORDER BY ti.item_id ASC
    `,
    [transactionId]
  );
  return rows;
};

const findExistingTransactionIds = async (ids) => {
  if (ids.length === 0) {
    return [];
  }
  const { rows } = await db.query(
    'SELECT transaction_id FROM transactions WHERE transaction_id = ANY($1::varchar[])',
    [ids]
  );
  return rows.map((row) => row.transaction_id);
};

/**
 * Item penjualan yang sudah ada untuk deteksi duplikat baris import tanpa nomor pesanan.
 */
const findExistingItemsForDedup = async ({ minDate, maxDate, skus }) => {
  if (!skus.length) {
    return [];
  }
  const { rows } = await db.query(
    `
      SELECT tanggal, kanal, sku, qty, revenue
      FROM transaction_items
      WHERE tanggal BETWEEN $1 AND $2
        AND sku = ANY($3::varchar[])
    `,
    [minDate, maxDate, skus]
  );
  return rows;
};

const findSellableProducts = async (skus) => {
  if (!skus.length) {
    return [];
  }
  const { rows } = await db.query(
    `
      SELECT sku, nama, satuan_stok, is_active, is_sellable,
             harga_jual_offline, harga_jual_online
      FROM products
      WHERE UPPER(sku) = ANY($1::varchar[])
    `,
    [skus.map((sku) => sku.toUpperCase())]
  );
  return rows;
};

const findMappedSkus = async (texts) => {
  if (!texts.length) {
    return [];
  }
  const { rows } = await db.query(
    `
      SELECT DISTINCT ON (LOWER(TRIM(teks)))
        LOWER(TRIM(teks)) AS normalized_teks,
        sku_hasil
      FROM product_mapping
      WHERE status = 'masuk'
        AND sku_hasil IS NOT NULL
        AND LOWER(TRIM(teks)) = ANY($1::text[])
      ORDER BY LOWER(TRIM(teks)), jumlah_baris DESC
    `,
    [texts]
  );
  return rows;
};

const findStocks = async (skus, executor = db) => {
  const { rows } = await executor.query(
    'SELECT sku, stok FROM v_stok_saat_ini WHERE sku = ANY($1::varchar[])',
    [skus]
  );
  return rows;
};

const insertRows = async (client, table, columns, rows) => {
  if (rows.length === 0) {
    return;
  }
  const chunkSize = Math.floor(30000 / columns.length);
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const placeholders = chunk.map((row) => {
      const slots = columns.map((col) => {
        values.push(row[col]);
        return `$${values.length}`;
      });
      return `(${slots.join(', ')})`;
    });
    // eslint-disable-next-line no-await-in-loop
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
      values
    );
  }
};

/**
 * Menyimpan transaksi + item + mutasi stok penjualan dalam satu transaksi DB.
 * Opsional membuat import_batches dan mencatat baris ditolak (untuk import).
 */
const saveSalesRecords = async ({
  transactions,
  items,
  movements,
  importBatch = null,
  rejectedRows = [],
}) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let batch = null;
    if (importBatch) {
      const { rows } = await client.query(
        `
          INSERT INTO import_batches (
            jenis_impor, kanal, nama_berkas, periode_mulai, periode_akhir,
            baris_total, baris_baru, baris_duplikat, baris_ditolak,
            status, diimpor_oleh, diimpor_pada
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
          RETURNING *
        `,
        [
          importBatch.jenisImpor,
          importBatch.kanal,
          clipText(importBatch.namaBerkas, 200),
          importBatch.periodeMulai,
          importBatch.periodeAkhir,
          importBatch.barisTotal,
          importBatch.barisBaru,
          importBatch.barisDuplikat,
          importBatch.barisDitolak,
          importBatch.status,
          importBatch.diimporOleh,
        ]
      );
      [batch] = rows;
    }

    const batchId = batch ? batch.batch_id : null;
    const withBatch = (row) => ({ ...row, batch_id: batchId });

    await insertRows(
      client,
      'transactions',
      [
        'transaction_id',
        'kanal',
        'tanggal',
        'jumlah_item',
        'total_qty',
        'total_revenue',
        'order_no_generated',
        'batch_id',
      ],
      transactions.map(withBatch)
    );
    await insertRows(
      client,
      'transaction_items',
      [
        'item_id',
        'transaction_id',
        'kanal',
        'tanggal',
        'sku',
        'qty',
        'harga_satuan',
        'diskon_rp',
        'revenue',
        'berkas',
        'baris_excel',
        'batch_id',
      ],
      items.map(withBatch)
    );
    await insertRows(
      client,
      'stock_movements',
      [
        'tanggal',
        'sku',
        'jenis',
        'qty',
        'ref',
        'sumber',
        'order_date',
        'batch_id',
      ],
      movements.map(withBatch)
    );

    if (rejectedRows.length > 0) {
      await insertRows(
        client,
        'laporan_ditolak',
        [
          'tahap',
          'berkas',
          'baris_excel',
          'teks',
          'alasan',
          'jenis_alasan',
          'batch_id',
        ],
        rejectedRows.map((row) =>
          withBatch({
            tahap: 'IMPORT_PENJUALAN',
            berkas: clipText(importBatch ? importBatch.namaBerkas : '-', 200),
            baris_excel: row.rowNumber,
            teks: clipText(row.rawText, 300),
            alasan: clipText(row.reason, 300),
            jenis_alasan: 'VALIDASI_IMPORT_PENJUALAN',
          })
        )
      );
    }

    const skus = [...new Set(movements.map((m) => m.sku))];
    const stocks = await findStocks(skus, client);

    await client.query('COMMIT');
    return { batch, stocks };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findTransactions,
  summarizeTransactions,
  findTransactionById,
  findTransactionItems,
  findExistingTransactionIds,
  findExistingItemsForDedup,
  findSellableProducts,
  findMappedSkus,
  saveSalesRecords,
};
