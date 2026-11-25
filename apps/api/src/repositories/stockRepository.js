const db = require('../config/db');

const getClient = () =>
  typeof db.connect === 'function' ? db.connect() : db.pool.connect();

const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&');

const STOCK_OVERVIEW_CTE = `
  WITH latest_opname AS (
    SELECT DISTINCT ON (sku)
      sku,
      tanggal AS tanggal_opname,
      stok_fisik,
      selisih,
      alasan_selisih
    FROM stock_opname
    ORDER BY sku, tanggal DESC
  ),
  stock_overview AS (
    SELECT
      p.sku,
      p.product_id,
      p.nama,
      p.kategori,
      p.is_sellable,
      p.is_bundle,
      p.is_induk_pemecahan,
      p.satuan_stok,
      p.sku_induk,
      p.nama_induk,
      p.faktor_ke_induk,
      COALESCE(s.stok, 0) AS stok_sistem,
      COALESCE(rs.stok_pengaman, 2) AS safety_stock,
      COALESCE(rs.stok_minimum_manual, rs.titik_pesan_ulang, rs.stok_pengaman, 2) AS reorder_point,
      COALESCE(rs.lead_time_hari, 7) AS lead_time_hari,
      lo.tanggal_opname,
      lo.stok_fisik,
      lo.selisih,
      vp.estimasi_hari_habis,
      CASE
        WHEN COALESCE(s.stok, 0) <= COALESCE(rs.stok_pengaman, 2)
          OR (vp.estimasi_hari_habis IS NOT NULL AND vp.estimasi_hari_habis <= COALESCE(rs.lead_time_hari, 7))
          THEN 'kritis'
        WHEN COALESCE(s.stok, 0) <= COALESCE(rs.stok_minimum_manual, rs.titik_pesan_ulang, rs.stok_pengaman, 2)
          OR (vp.estimasi_hari_habis IS NOT NULL AND vp.estimasi_hari_habis <= COALESCE(rs.lead_time_hari, 7) * 2)
          THEN 'waspada'
        ELSE 'aman'
      END AS status
    FROM products p
    LEFT JOIN v_stok_saat_ini s ON s.sku = p.sku
    LEFT JOIN reorder_settings rs ON rs.sku = p.sku
    LEFT JOIN latest_opname lo ON lo.sku = p.sku
    LEFT JOIN v_proyeksi_stok vp ON vp.sku = p.sku
    WHERE p.is_active = TRUE
  )
`;

const buildFilterClause = ({ isSellable, status, search }) => {
  const conditions = [];
  const params = [];

  if (isSellable !== null) {
    params.push(isSellable);
    conditions.push(`is_sellable = $${params.length}`);
  }

  if (status && status !== 'all') {
    if (status === 'selisih_opname') {
      conditions.push('selisih IS NOT NULL AND selisih <> 0');
    } else {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
  }

  if (search !== null) {
    params.push(`%${escapeLikePattern(search)}%`);
    const idx = params.length;
    conditions.push(
      `(sku ILIKE $${idx} ESCAPE '\\' OR nama ILIKE $${idx} ESCAPE '\\' OR COALESCE(nama_induk, '') ILIKE $${idx} ESCAPE '\\')`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

const findStocks = async ({ isSellable, status, search, limit, offset }) => {
  const { whereClause, params } = buildFilterClause({
    isSellable,
    status,
    search,
  });

  params.push(limit);
  const limitParam = `$${params.length}`;

  params.push(offset);
  const offsetParam = `$${params.length}`;

  const query = `
    ${STOCK_OVERVIEW_CTE}
    SELECT
      sku,
      product_id,
      nama,
      kategori,
      is_sellable,
      is_bundle,
      is_induk_pemecahan,
      satuan_stok,
      sku_induk,
      nama_induk,
      faktor_ke_induk,
      stok_sistem,
      safety_stock,
      reorder_point,
      tanggal_opname,
      stok_fisik,
      selisih,
      estimasi_hari_habis,
      status
    FROM stock_overview
    ${whereClause}
    ORDER BY product_id ASC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const { rows } = await db.query(query, params);
  return rows;
};

const countStocks = async ({ isSellable, status, search }) => {
  const { whereClause, params } = buildFilterClause({
    isSellable,
    status,
    search,
  });

  const query = `
    ${STOCK_OVERVIEW_CTE}
    SELECT COUNT(*)::int AS total
    FROM stock_overview
    ${whereClause}
  `;

  const { rows } = await db.query(query, params);
  return rows[0].total;
};

const getStockSummary = async () => {
  const query = `
    ${STOCK_OVERVIEW_CTE}
    SELECT
      COUNT(*)::int AS total_sku_aktif,
      COUNT(*) FILTER (WHERE status = 'kritis')::int AS total_sku_kritis,
      (SELECT COUNT(*)::int FROM v_rekomendasi_restok) AS prediksi_restock,
      COUNT(*) FILTER (WHERE selisih IS NOT NULL AND selisih <> 0)::int AS total_selisih_opname,
      GREATEST(
        (SELECT MAX(tanggal) FROM stock_movements),
        (SELECT MAX(tanggal) FROM stock_opname)
      ) AS last_updated_date
    FROM stock_overview
  `;

  const { rows } = await db.query(query);
  return rows[0];
};

const findProductStockHeader = async (sku) => {
  const query = `
    SELECT
      p.sku,
      p.product_id,
      p.nama,
      p.kategori,
      p.satuan_stok,
      p.is_active,
      p.is_sellable,
      p.is_bundle,
      p.is_induk_pemecahan,
      COALESCE(s.stok, 0) AS stok_saat_ini
    FROM products p
    LEFT JOIN v_stok_saat_ini s ON s.sku = p.sku
    WHERE p.sku = $1
  `;

  const { rows } = await db.query(query, [sku]);
  return rows[0] || null;
};

const findStockMovements = async ({ sku, limit, offset }) => {
  const query = `
    SELECT
      movement_id,
      tanggal,
      order_date,
      sku,
      nama_produk,
      satuan_stok,
      jenis,
      arah,
      keterangan_jenis,
      qty,
      saldo_berjalan,
      ref,
      sumber,
      batch_id
    FROM v_kartu_stok
    WHERE sku = $1
    ORDER BY tanggal DESC, movement_id DESC
    LIMIT $2
    OFFSET $3
  `;

  const { rows } = await db.query(query, [sku, limit, offset]);
  return rows;
};

const countStockMovements = async (sku) => {
  const query = `
    SELECT COUNT(*)::int AS total
    FROM v_kartu_stok
    WHERE sku = $1
  `;

  const { rows } = await db.query(query, [sku]);
  return rows[0].total;
};

const findRepackAlerts = async () => {
  const query = `
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
      saran_qty_kemasan,
      saran_qty_induk,
      status_induk
    FROM v_saran_pemecahan
    ORDER BY status_induk ASC, stok_kemasan_saat_ini ASC, sku ASC
  `;

  const { rows } = await db.query(query);
  return rows;
};

const findBundleAlerts = async () => {
  const query = `
    SELECT
      sku_paket,
      nama_paket,
      satuan_stok,
      stok_paket_jadi,
      maks_paket_bisa_dirakit,
      perlu_dirakit
    FROM v_ketersediaan_paket
    WHERE perlu_dirakit = TRUE
    ORDER BY stok_paket_jadi ASC, sku_paket ASC
  `;

  const { rows } = await db.query(query);
  return rows;
};

const findRestockAlerts = async () => {
  const query = `
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
      prediksi_kebutuhan_30_hari,
      selisih_kebutuhan_stok,
      saran_jumlah_beli
    FROM v_rekomendasi_restok
    ORDER BY stok_saat_ini ASC, sku ASC
  `;

  const { rows } = await db.query(query);
  return rows;
};

const findProductsBySkus = async (skus, executor = db) => {
  const query = `
    SELECT
      sku,
      product_id,
      nama,
      kategori,
      is_active,
      is_sellable,
      is_bundle,
      is_induk_pemecahan,
      satuan_stok,
      sku_induk,
      nama_induk,
      faktor_ke_induk,
      isi_per_pembelian,
      satuan_beli
    FROM products
    WHERE sku = ANY($1::varchar[])
  `;

  const { rows } = await executor.query(query, [skus]);
  return rows;
};

const findBundleComponentsBySkus = async (bundleSkus, executor = db) => {
  const query = `
    SELECT
      bc.sku_paket,
      bc.sku_komponen,
      bc.qty_komponen_per_paket,
      p.nama AS nama_komponen,
      p.is_active AS komponen_aktif
    FROM bundle_components bc
    JOIN products p ON p.sku = bc.sku_komponen
    WHERE bc.sku_paket = ANY($1::varchar[])
    ORDER BY bc.sku_paket ASC, bc.sku_komponen ASC
  `;

  const { rows } = await executor.query(query, [bundleSkus]);
  return rows;
};

const findCurrentStocksBySkus = async (skus, executor = db) => {
  const query = `
    SELECT
      sku,
      stok
    FROM v_stok_saat_ini
    WHERE sku = ANY($1::varchar[])
  `;

  const { rows } = await executor.query(query, [skus]);
  return rows;
};

const insertStockMovementsBatch = async (movements) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const values = [];
    const placeholders = movements.map((move, index) => {
      const base = index * 6;
      values.push(
        move.tanggal,
        move.sku,
        move.jenis,
        move.qty,
        move.ref,
        move.sumber
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const insertSql = `
      INSERT INTO stock_movements (tanggal, sku, jenis, qty, ref, sumber)
      VALUES ${placeholders.join(', ')}
      RETURNING movement_id, tanggal, sku, jenis, qty, ref, sumber
    `;

    const { rows: insertedRows } = await client.query(insertSql, values);

    const uniqueSkus = [...new Set(movements.map((m) => m.sku))];
    const updatedStocks = await findCurrentStocksBySkus(uniqueSkus, client);

    await client.query('COMMIT');
    return {
      insertedRows,
      updatedStocks,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findOpnameSheet = async ({ level, search }) => {
  const conditions = ['p.is_active = TRUE'];
  const params = [];

  if (level === 'induk') {
    conditions.push('p.is_induk_pemecahan = TRUE');
  } else {
    conditions.push('p.is_induk_pemecahan = FALSE');
  }

  if (search !== null) {
    params.push(`%${escapeLikePattern(search)}%`);
    const idx = params.length;
    conditions.push(
      `(p.sku ILIKE $${idx} ESCAPE '\\' OR p.nama ILIKE $${idx} ESCAPE '\\')`
    );
  }

  const query = `
    WITH last_opname AS (
      SELECT DISTINCT ON (sku)
        sku,
        tanggal AS tanggal_opname_terakhir,
        stok_fisik AS stok_fisik_terakhir,
        selisih AS selisih_terakhir,
        alasan_selisih AS alasan_selisih_terakhir
      FROM stock_opname
      ORDER BY sku, tanggal DESC
    )
    SELECT
      p.sku,
      p.product_id,
      p.nama,
      p.kategori,
      p.is_sellable,
      p.is_bundle,
      p.is_induk_pemecahan,
      p.satuan_stok,
      COALESCE(p.isi_per_pembelian, 50) AS isi_per_pembelian,
      p.satuan_beli,
      COALESCE(s.stok, 0) AS stok_sistem,
      lo.tanggal_opname_terakhir,
      lo.stok_fisik_terakhir,
      lo.selisih_terakhir,
      lo.alasan_selisih_terakhir
    FROM products p
    LEFT JOIN v_stok_saat_ini s ON s.sku = p.sku
    LEFT JOIN last_opname lo ON lo.sku = p.sku
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.product_id ASC
  `;

  const { rows } = await db.query(query, params);
  return rows;
};

const findOpnameHistory = async ({ sku, tanggal, limit, offset }) => {
  const conditions = [];
  const params = [];

  if (sku !== null) {
    params.push(sku);
    conditions.push(`so.sku = $${params.length}`);
  }

  if (tanggal !== null) {
    params.push(tanggal);
    conditions.push(`so.tanggal = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);
  const limitParam = `$${params.length}`;

  params.push(offset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      so.tanggal,
      so.sku,
      p.nama AS nama_produk,
      p.is_induk_pemecahan,
      COALESCE(p.isi_per_pembelian, 50) AS isi_per_pembelian,
      so.stok_fisik,
      so.stok_sistem,
      so.selisih,
      so.satuan_stok,
      so.alasan_selisih,
      so.catatan,
      so.aturan_sku,
      so.berkas,
      so.batch_id
    FROM stock_opname so
    JOIN products p ON p.sku = so.sku
    ${whereClause}
    ORDER BY so.tanggal DESC, p.product_id ASC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const { rows } = await db.query(query, params);
  return rows;
};

const countOpnameHistory = async ({ sku, tanggal }) => {
  const conditions = [];
  const params = [];

  if (sku !== null) {
    params.push(sku);
    conditions.push(`sku = $${params.length}`);
  }

  if (tanggal !== null) {
    params.push(tanggal);
    conditions.push(`tanggal = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT COUNT(*)::int AS total
    FROM stock_opname
    ${whereClause}
  `;

  const { rows } = await db.query(query, params);
  return rows[0].total;
};

const findExistingOpnameOnDate = async (tanggal, skus, executor = db) => {
  const query = `
    SELECT sku
    FROM stock_opname
    WHERE tanggal = $1
      AND sku = ANY($2::varchar[])
  `;

  const { rows } = await executor.query(query, [tanggal, skus]);
  return rows.map((r) => r.sku);
};

const saveOpnameSession = async ({ tanggal, entries }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const opnameValues = [];
    const opnamePlaceholders = entries.map((entry, index) => {
      const base = index * 9;
      opnameValues.push(
        tanggal,
        entry.sku,
        entry.stokFisik,
        entry.stokSistem,
        entry.selisih,
        entry.satuanStok,
        entry.catatan,
        entry.alasanSelisih,
        entry.aturanSku
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
    });

    const insertOpnameSql = `
      INSERT INTO stock_opname (
        tanggal, sku, stok_fisik, stok_sistem, selisih,
        satuan_stok, catatan, alasan_selisih, aturan_sku
      )
      VALUES ${opnamePlaceholders.join(', ')}
      RETURNING tanggal, sku, stok_fisik, stok_sistem, selisih, satuan_stok, catatan, alasan_selisih, aturan_sku
    `;

    const { rows: insertedOpnames } = await client.query(
      insertOpnameSql,
      opnameValues
    );

    const entriesWithDiscrepancy = entries.filter(
      (entry) => entry.selisih !== 0
    );
    let insertedAdjustments = [];

    if (entriesWithDiscrepancy.length > 0) {
      const adjValues = [];
      const adjPlaceholders = entriesWithDiscrepancy.map((entry, index) => {
        const base = index * 5;
        adjValues.push(
          tanggal,
          entry.sku,
          entry.selisih,
          entry.ref,
          entry.sumber
        );
        return `($${base + 1}, $${base + 2}, 'ADJUSTMENT', $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      const insertAdjustmentSql = `
        INSERT INTO stock_movements (tanggal, sku, jenis, qty, ref, sumber)
        VALUES ${adjPlaceholders.join(', ')}
        RETURNING movement_id, tanggal, sku, jenis, qty, ref, sumber
      `;

      const { rows: adjRows } = await client.query(
        insertAdjustmentSql,
        adjValues
      );
      insertedAdjustments = adjRows;
    }

    await client.query('COMMIT');
    return {
      insertedOpnames,
      insertedAdjustments,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findProductAliasesByTexts = async (texts) => {
  if (!texts || texts.length === 0) {
    return [];
  }

  const query = `
    SELECT
      LOWER(TRIM(teks)) AS normalized_teks,
      sku_hasil
    FROM product_mapping
    WHERE status = 'masuk'
      AND sku_hasil IS NOT NULL
      AND LOWER(TRIM(teks)) = ANY($1::text[])
  `;

  const { rows } = await db.query(query, [texts]);
  return rows;
};

const findExistingStockMovementsForDedup = async ({
  minDate,
  maxDate,
  skus,
}) => {
  if (!skus || skus.length === 0 || !minDate || !maxDate) {
    return [];
  }

  const query = `
    SELECT
      tanggal::text AS tanggal,
      sku,
      jenis,
      qty,
      COALESCE(sumber, '') AS sumber
    FROM stock_movements
    WHERE tanggal >= $1::date
      AND tanggal <= $2::date
      AND sku = ANY($3::varchar[])
  `;

  const { rows } = await db.query(query, [minDate, maxDate, skus]);
  return rows;
};

const getTableColumns = async (client, tableName) => {
  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `;
  const { rows } = await client.query(query, [tableName]);
  return new Set(rows.map((r) => r.column_name));
};

const pickFirstExistingColumn = (columnSet, candidates) =>
  candidates.find((col) => columnSet.has(col)) || null;

const commitStockImportBatch = async ({
  fileName,
  totalRows,
  validRows,
  duplicateCount,
  rejectedRows,
}) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const batchColumns = await getTableColumns(client, 'import_batches');

    let statusBatch = 'berhasil';
    if (validRows.length === 0) {
      statusBatch = 'gagal';
    } else if (rejectedRows.length > 0 || duplicateCount > 0) {
      statusBatch = 'sebagian';
    }

    const batchFieldMappings = [
      {
        col: pickFirstExistingColumn(batchColumns, [
          'berkas',
          'nama_berkas',
          'nama_file',
          'file_name',
          'filename',
        ]),
        val: fileName,
      },
      {
        col: pickFirstExistingColumn(batchColumns, [
          'sumber',
          'jenis',
          'tipe',
          'source',
        ]),
        val: 'IMPORT_STOK_UI',
      },
      {
        col: pickFirstExistingColumn(batchColumns, [
          'baris_total',
          'total_baris',
          'total_rows',
          'jumlah_baris',
        ]),
        val: totalRows,
      },
      {
        col: pickFirstExistingColumn(batchColumns, [
          'baris_baru',
          'baris_valid',
          'baris_berhasil',
          'baris_masuk',
          'valid_rows',
          'inserted_rows',
        ]),
        val: validRows.length,
      },
      {
        col: pickFirstExistingColumn(batchColumns, [
          'baris_duplikat',
          'duplikat',
          'duplicate_rows',
        ]),
        val: duplicateCount,
      },
      {
        col: pickFirstExistingColumn(batchColumns, [
          'baris_ditolak',
          'ditolak',
          'rejected_rows',
        ]),
        val: rejectedRows.length,
      },
      {
        col: pickFirstExistingColumn(batchColumns, ['status']),
        val: statusBatch,
      },
    ].filter((item) => item.col !== null);

    const batchColNames = batchFieldMappings.map((item) => item.col);
    const batchPlaceholders = batchFieldMappings.map((_, idx) => `$${idx + 1}`);
    const batchValues = batchFieldMappings.map((item) => item.val);

    const insertBatchSql = `
      INSERT INTO import_batches (${batchColNames.join(', ')})
      VALUES (${batchPlaceholders.join(', ')})
      RETURNING *
    `;

    const { rows: batchRows } = await client.query(insertBatchSql, batchValues);
    const batch = batchRows[0];
    const batchId = batch.batch_id !== undefined ? batch.batch_id : batch.id;

    let insertedMovements = [];
    if (validRows.length > 0) {
      const moveValues = [];
      const movePlaceholders = validRows.map((row, index) => {
        const base = index * 7;
        const ref = `IMPORT-${batchId}-${row.rowNumber}`;
        const sumber = row.catatan || `Import Berkas (${fileName})`;
        moveValues.push(
          row.tanggal,
          row.sku,
          row.jenis,
          row.qty,
          ref,
          sumber,
          batchId
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
      });

      const insertMoveSql = `
        INSERT INTO stock_movements (tanggal, sku, jenis, qty, ref, sumber, batch_id)
        VALUES ${movePlaceholders.join(', ')}
        RETURNING movement_id, tanggal, sku, jenis, qty, ref, sumber, batch_id
      `;

      const { rows: moveRows } = await client.query(insertMoveSql, moveValues);
      insertedMovements = moveRows;
    }

    if (rejectedRows.length > 0) {
      const rejectColumns = await getTableColumns(client, 'laporan_ditolak');
      const rejectColSpecs = [
        {
          col: pickFirstExistingColumn(rejectColumns, ['batch_id']),
          getValue: () => batchId,
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'tahap',
            'sumber',
            'stage',
          ]),
          getValue: () => 'IMPORT_STOK',
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'berkas',
            'nama_berkas',
            'nama_file',
            'file_name',
            'filename',
          ]),
          getValue: () => fileName,
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'baris_excel',
            'baris',
            'no_baris',
            'row_number',
          ]),
          getValue: (row) => row.rowNumber,
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'teks',
            'data_mentah',
            'raw_text',
            'konten',
          ]),
          getValue: (row) => row.rawText,
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'alasan',
            'keterangan',
            'reason',
          ]),
          getValue: (row) => row.reason,
        },
        {
          col: pickFirstExistingColumn(rejectColumns, [
            'jenis_alasan',
            'kategori_alasan',
            'error_type',
          ]),
          getValue: () => 'VALIDASI_IMPORT_STOK',
        },
      ].filter((spec) => spec.col !== null);

      const rejectColNames = rejectColSpecs.map((spec) => spec.col);
      const rejectValues = [];
      const rejectPlaceholders = rejectedRows.map((row) => {
        const rowPlaceholders = rejectColSpecs.map((spec) => {
          rejectValues.push(spec.getValue(row));
          return `$${rejectValues.length}`;
        });
        return `(${rowPlaceholders.join(', ')})`;
      });

      const insertRejectSql = `
        INSERT INTO laporan_ditolak (${rejectColNames.join(', ')})
        VALUES ${rejectPlaceholders.join(', ')}
      `;

      await client.query(insertRejectSql, rejectValues);
    }

    await client.query('COMMIT');
    return {
      batch,
      insertedMovements,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findStocks,
  countStocks,
  getStockSummary,
  findProductStockHeader,
  findStockMovements,
  countStockMovements,
  findRepackAlerts,
  findBundleAlerts,
  findRestockAlerts,
  findProductsBySkus,
  findBundleComponentsBySkus,
  findCurrentStocksBySkus,
  insertStockMovementsBatch,
  findOpnameSheet,
  findOpnameHistory,
  countOpnameHistory,
  findExistingOpnameOnDate,
  saveOpnameSession,
  findProductAliasesByTexts,
  findExistingStockMovementsForDedup,
  commitStockImportBatch,
};
