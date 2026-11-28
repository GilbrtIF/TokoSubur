const crypto = require('crypto');
const transactionRepository = require('../repositories/transactionRepository');
const masterRepository = require('../repositories/masterRepository');
const { InvariantError, NotFoundError } = require('../exceptions');
const {
  parseTabularFile,
  formatExcelDate,
} = require('../utils/tabularFileParser');
const { round2, toNumberOrNull, clipText } = require('../utils/format');
const { isOnlineChannel, isOfflineChannel } = require('../utils/channel');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TRANSACTION_ID_LENGTH = 60;
const MAX_ITEM_ID_LENGTH = 40;
const SALES_IMPORT_COLUMNS = ['tanggal', 'kanal', 'sku', 'qty', 'harga_satuan'];
const SALES_IMPORT_ALIASES = {
  sku: ['produk', 'nama_produk'],
  harga_satuan: ['harga'],
  no_pesanan: [
    'no_order',
    'order_id',
    'no_nota',
    'transaction_id',
    'nomor_pesanan',
  ],
  diskon: ['diskon_rp', 'potongan'],
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const todayJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date()
  );

const endOfMonth = (isoDate) => {
  const [year, month] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};

const randomSuffix = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const generateTransactionId = (kode, tanggal) =>
  `${kode}-${tanggal.replace(/-/g, '')}-${randomSuffix()}`;

const buildItemId = (transactionId, index) => {
  const candidate = `${transactionId}-${index}`;
  return candidate.length <= MAX_ITEM_ID_LENGTH
    ? candidate
    : `ITM-${crypto.randomBytes(6).toString('hex').toUpperCase()}-${index}`;
};

const toText = (value) =>
  value === undefined || value === null ? '' : String(value).trim();

const buildRawText = (row) =>
  [
    row.tanggal,
    row.kanal,
    row.noPesanan,
    row.identifier,
    row.qty,
    row.hargaSatuan,
    row.diskonRp,
  ]
    .map(toText)
    .filter((value) => value !== '')
    .join(' | ');

// ---------------------------------------------------------------------------
// Validasi baris penjualan (dipakai input nota, preview, dan commit import)
// ---------------------------------------------------------------------------

/**
 * @param {Array<object>} rows baris mentah: { rowNumber, tanggal, kanal, noPesanan, identifier, qty, hargaSatuan, diskonRp }
 * @returns {Promise<{ validRows: object[], rejectedRows: object[] }>}
 */
const resolveSalesRows = async (rows) => {
  const channels = await masterRepository.findChannels();
  const channelMap = new Map(channels.map((c) => [c.kanal.toLowerCase(), c]));

  const identifiers = [
    ...new Set(rows.map((r) => toText(r.identifier)).filter(Boolean)),
  ];
  const [directProducts, mappings] = await Promise.all([
    transactionRepository.findSellableProducts(identifiers),
    transactionRepository.findMappedSkus(
      identifiers.map((v) => v.toLowerCase())
    ),
  ]);

  const productMap = new Map(
    directProducts.map((p) => [p.sku.toUpperCase(), p])
  );
  const mappingMap = new Map(
    mappings.map((m) => [m.normalized_teks, m.sku_hasil.toUpperCase()])
  );
  const missingMapped = [
    ...new Set(mappings.map((m) => m.sku_hasil.toUpperCase())),
  ].filter((sku) => !productMap.has(sku));
  if (missingMapped.length > 0) {
    (await transactionRepository.findSellableProducts(missingMapped)).forEach(
      (p) => productMap.set(p.sku.toUpperCase(), p)
    );
  }

  const validRows = [];
  const rejectedRows = [];

  rows.forEach((row) => {
    const rawText = row.rawText || buildRawText(row);
    const reject = (reason) =>
      rejectedRows.push({ rowNumber: row.rowNumber, rawText, reason });

    const tanggal = toText(row.tanggal);
    if (!isValidIsoDate(tanggal)) {
      reject(`Tanggal "${tanggal}" tidak valid (gunakan YYYY-MM-DD)`);
      return;
    }

    const channel = channelMap.get(toText(row.kanal).toLowerCase());
    if (!channel) {
      reject(`Kanal "${toText(row.kanal)}" tidak terdaftar`);
      return;
    }

    const noPesanan = toText(row.noPesanan) || null;
    if (noPesanan && noPesanan.length > MAX_TRANSACTION_ID_LENGTH) {
      reject(`Nomor pesanan maksimal ${MAX_TRANSACTION_ID_LENGTH} karakter`);
      return;
    }

    const identifier = toText(row.identifier);
    const resolvedSku = productMap.has(identifier.toUpperCase())
      ? identifier.toUpperCase()
      : mappingMap.get(identifier.toLowerCase());
    const product = resolvedSku ? productMap.get(resolvedSku) : null;
    if (!product) {
      reject(
        `Produk "${identifier}" tidak ditemukan di katalog maupun mapping produk`
      );
      return;
    }
    if (!product.is_active) {
      reject(`Produk "${product.sku}" sudah nonaktif`);
      return;
    }
    if (!product.is_sellable) {
      reject(`Produk "${product.sku}" bukan produk jual`);
      return;
    }

    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      reject(`Qty "${toText(row.qty)}" harus bilangan bulat lebih dari 0`);
      return;
    }

    const online = isOnlineChannel(channel);
    let hargaSatuan;
    if (toText(row.hargaSatuan) === '') {
      hargaSatuan = toNumberOrNull(
        online ? product.harga_jual_online : product.harga_jual_offline
      );
      if (hargaSatuan === null) {
        reject(
          `Harga satuan wajib diisi karena harga jual ${product.sku} belum diatur`
        );
        return;
      }
    } else {
      hargaSatuan = Number(row.hargaSatuan);
      if (!Number.isFinite(hargaSatuan) || hargaSatuan < 0) {
        reject(
          `Harga satuan "${toText(row.hargaSatuan)}" harus angka minimal 0`
        );
        return;
      }
    }

    const diskonRp = toText(row.diskonRp) === '' ? 0 : Number(row.diskonRp);
    if (!Number.isFinite(diskonRp) || diskonRp < 0) {
      reject(`Diskon "${toText(row.diskonRp)}" harus angka minimal 0`);
      return;
    }

    const bruto = round2(qty * hargaSatuan);
    if (diskonRp > bruto) {
      reject(`Diskon (${diskonRp}) melebihi subtotal (${bruto})`);
      return;
    }

    validRows.push({
      rowNumber: row.rowNumber,
      rawText,
      tanggal,
      kanal: channel.kanal,
      kodeKanal: channel.kode,
      isOnline: online,
      noPesanan,
      sku: product.sku,
      namaProduk: product.nama,
      satuanStok: product.satuan_stok,
      qty,
      hargaSatuan: round2(hargaSatuan),
      diskonRp: round2(diskonRp),
      revenue: round2(bruto - diskonRp),
    });
  });

  return { validRows, rejectedRows };
};

// ---------------------------------------------------------------------------
// Pengelompokan & deteksi duplikat
// ---------------------------------------------------------------------------

/**
 * Baris bernomor pesanan dikelompokkan per (kanal, nomor pesanan).
 * Baris tanpa nomor pesanan dikelompokkan per (kanal, tanggal) menjadi satu nota harian.
 */
const groupRows = (rows) => {
  const groups = new Map();
  const conflicts = [];

  rows.forEach((row) => {
    const key = row.noPesanan
      ? `ID|${row.noPesanan}`
      : `AUTO|${row.kanal}|${row.tanggal}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        noPesanan: row.noPesanan,
        kanal: row.kanal,
        tanggal: row.tanggal,
        rows: [],
      });
    }
    const group = groups.get(key);
    if (
      row.noPesanan &&
      (group.tanggal !== row.tanggal || group.kanal !== row.kanal)
    ) {
      conflicts.push({
        rowNumber: row.rowNumber,
        rawText: row.rawText,
        reason: `Nomor pesanan ${row.noPesanan} memiliki tanggal/kanal berbeda dengan baris sebelumnya`,
      });
      return;
    }
    group.rows.push(row);
  });

  return { groups: [...groups.values()], conflicts };
};

const itemFingerprint = ({ tanggal, kanal, sku, qty, revenue }) =>
  `${tanggal}|${String(kanal).toLowerCase()}|${sku}|${Number(qty)}|${round2(revenue)}`;

const splitDuplicateGroups = async (groups) => {
  const explicitIds = groups.filter((g) => g.noPesanan).map((g) => g.noPesanan);
  const existingIds = new Set(
    await transactionRepository.findExistingTransactionIds(explicitIds)
  );

  const autoRows = groups.filter((g) => !g.noPesanan).flatMap((g) => g.rows);
  let existingFingerprints = new Set();
  if (autoRows.length > 0) {
    const dates = autoRows.map((r) => r.tanggal).sort();
    const existing = await transactionRepository.findExistingItemsForDedup({
      minDate: dates[0],
      maxDate: dates[dates.length - 1],
      skus: [...new Set(autoRows.map((r) => r.sku))],
    });
    existingFingerprints = new Set(existing.map(itemFingerprint));
  }

  const uniqueGroups = [];
  const duplicateRows = [];
  const seenInFile = new Set();

  groups.forEach((group) => {
    if (group.noPesanan) {
      if (existingIds.has(group.noPesanan)) {
        group.rows.forEach((row) =>
          duplicateRows.push({
            rowNumber: row.rowNumber,
            rawText: row.rawText,
            reason: `Nomor pesanan ${group.noPesanan} sudah tercatat`,
          })
        );
        return;
      }
      uniqueGroups.push(group);
      return;
    }

    const keptRows = [];
    group.rows.forEach((row) => {
      const fingerprint = itemFingerprint(row);
      if (existingFingerprints.has(fingerprint)) {
        duplicateRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          reason: 'Penjualan identik sudah tercatat di database',
        });
      } else if (seenInFile.has(fingerprint)) {
        duplicateRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          reason: 'Baris duplikat di dalam berkas yang sama',
        });
      } else {
        seenInFile.add(fingerprint);
        keptRows.push(row);
      }
    });
    if (keptRows.length > 0) {
      uniqueGroups.push({ ...group, rows: keptRows });
    }
  });

  return { uniqueGroups, duplicateRows };
};

// ---------------------------------------------------------------------------
// Penyusunan record database
// ---------------------------------------------------------------------------

const buildSalesRecords = (groups, { berkas = null } = {}) => {
  const transactions = [];
  const items = [];
  const movements = [];

  groups.forEach((group) => {
    const first = group.rows[0];
    const transactionId =
      group.noPesanan || generateTransactionId(first.kodeKanal, group.tanggal);

    transactions.push({
      transaction_id: transactionId,
      kanal: group.kanal,
      tanggal: group.tanggal,
      jumlah_item: group.rows.length,
      total_qty: group.rows.reduce((sum, r) => sum + r.qty, 0),
      total_revenue: round2(group.rows.reduce((sum, r) => sum + r.revenue, 0)),
      order_no_generated: !group.noPesanan,
    });

    group.rows.forEach((row, index) => {
      items.push({
        item_id: buildItemId(transactionId, index + 1),
        transaction_id: transactionId,
        kanal: group.kanal,
        tanggal: group.tanggal,
        sku: row.sku,
        qty: row.qty,
        harga_satuan: row.hargaSatuan,
        diskon_rp: row.diskonRp,
        revenue: row.revenue,
        berkas: berkas ? clipText(berkas, 200) : null,
        baris_excel: berkas ? row.rowNumber : null,
      });

      // Penjualan online dicatat di akhir bulan laporan, tanggal order disimpan di order_date.
      movements.push({
        tanggal: row.isOnline ? endOfMonth(group.tanggal) : group.tanggal,
        sku: row.sku,
        jenis: row.isOnline ? 'SALE_ONLINE' : 'SALE_OFFLINE',
        qty: -row.qty,
        ref: transactionId,
        sumber: clipText(
          `Penjualan ${group.kanal}${berkas ? ` (${berkas})` : ''}`,
          200
        ),
        order_date: row.isOnline ? group.tanggal : null,
      });
    });
  });

  return { transactions, items, movements };
};

const buildStockWarnings = (stocks) =>
  stocks
    .filter((s) => Number(s.stok) < 0)
    .map((s) => ({
      sku: s.sku,
      stokSaatIni: Number(s.stok),
      pesan: `Stok sistem ${s.sku} menjadi negatif (${Number(s.stok)}). Lakukan stok opname untuk koreksi.`,
    }));

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

const mapTransactionRow = (row) => ({
  transactionId: row.transaction_id,
  kanal: row.kanal,
  tanggal: row.tanggal,
  jumlahItem: Number(row.jumlah_item),
  totalQty: Number(row.total_qty),
  totalRevenue: Number(row.total_revenue),
  orderNoGenerated: Boolean(row.order_no_generated),
  batchId: toNumberOrNull(row.batch_id),
});

const getTransactions = async (filter) => {
  const [rows, summary] = await Promise.all([
    transactionRepository.findTransactions(filter),
    transactionRepository.summarizeTransactions(filter),
  ]);
  return {
    data: rows.map((row) => ({
      ...mapTransactionRow(row),
      ringkasanProduk: row.ringkasan_produk || '',
    })),
    meta: {
      limit: filter.limit,
      offset: filter.offset,
      total: summary.total,
      totalRevenue: Number(summary.total_revenue),
      totalQty: summary.total_qty,
    },
  };
};

const getTransactionById = async (transactionId) => {
  const header = await transactionRepository.findTransactionById(transactionId);
  if (!header) {
    throw new NotFoundError(`Transaksi ${transactionId} tidak ditemukan`);
  }
  const items = await transactionRepository.findTransactionItems(transactionId);

  return {
    ...mapTransactionRow(header),
    jenisKanal: header.jenis_kanal,
    items: items.map((item) => ({
      itemId: item.item_id,
      sku: item.sku,
      namaProduk: item.nama_produk,
      satuanStok: item.satuan_stok,
      qty: Number(item.qty),
      hargaSatuan: Number(item.harga_satuan),
      diskonRp: Number(item.diskon_rp),
      revenue: Number(item.revenue),
      berkas: item.berkas || null,
      barisExcel: item.baris_excel,
      keuanganOnline:
        item.netto === null
          ? null
          : {
              netto: Number(item.netto),
              komisiPlatform: Number(item.komisi_platform),
              ongkir: toNumberOrNull(item.ongkir),
              labaKotor: Number(item.laba_kotor),
              hppTotal: Number(item.hpp_total),
              labaBersih: Number(item.laba_bersih),
            },
    })),
  };
};

/**
 * Input nota manual (satu transaksi). Penjualan tidak ditolak walau stok kurang,
 * tetapi respons berisi peringatan stok negatif (sesuai aturan skema v4).
 */
const createTransaction = async ({ tanggal, kanal, noNota, items }) => {
  const saleDate = tanggal || todayJakarta();
  let saleChannel = kanal;
  if (!saleChannel) {
    const channels = await masterRepository.findChannels();
    const offline = channels.find((c) => isOfflineChannel(c));
    if (!offline) {
      throw new InvariantError(
        'kanal wajib diisi karena belum ada kanal offline terdaftar'
      );
    }
    saleChannel = offline.kanal;
  }
  const rows = items.map((item, index) => ({
    rowNumber: index,
    tanggal: saleDate,
    kanal: saleChannel,
    noPesanan: noNota,
    identifier: item.sku,
    qty: item.qty,
    hargaSatuan: item.hargaSatuan,
    diskonRp: item.diskonRp,
  }));

  const { validRows, rejectedRows } = await resolveSalesRows(rows);
  if (rejectedRows.length > 0) {
    const first = rejectedRows[0];
    const label =
      first.reason.startsWith('Kanal') ||
      first.reason.startsWith('Tanggal') ||
      first.reason.startsWith('Nomor')
        ? first.reason
        : `items[${first.rowNumber}]: ${first.reason}`;
    throw new InvariantError(label);
  }

  if (noNota) {
    const existing = await transactionRepository.findExistingTransactionIds([
      noNota,
    ]);
    if (existing.length > 0) {
      throw new InvariantError(`Nomor nota ${noNota} sudah tercatat`);
    }
  }

  const group = {
    noPesanan: noNota || null,
    kanal: validRows[0].kanal,
    tanggal: saleDate,
    rows: validRows,
  };
  const records = buildSalesRecords([group]);
  const { stocks } = await transactionRepository.saveSalesRecords(records);

  const created = await getTransactionById(
    records.transactions[0].transaction_id
  );
  return { transaction: created, warnings: buildStockWarnings(stocks) };
};

const readSalesFile = async (file) => {
  const rows = await parseTabularFile(file, {
    requiredColumns: SALES_IMPORT_COLUMNS,
    aliases: SALES_IMPORT_ALIASES,
  });
  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    tanggal: formatExcelDate(row.tanggal),
    kanal: toText(row.kanal),
    noPesanan: toText(row.no_pesanan),
    identifier: toText(row.sku),
    qty: row.qty,
    hargaSatuan: row.harga_satuan,
    diskonRp: row.diskon,
  }));
};

const analyzeSalesRows = async (rawRows) => {
  const { validRows, rejectedRows } = await resolveSalesRows(rawRows);
  const { groups, conflicts } = groupRows(validRows);
  const { uniqueGroups, duplicateRows } = await splitDuplicateGroups(groups);
  return {
    uniqueGroups,
    duplicateRows,
    rejectedRows: [...rejectedRows, ...conflicts].sort(
      (a, b) => a.rowNumber - b.rowNumber
    ),
  };
};

const toPreviewRow = (row) => ({
  rowNumber: row.rowNumber,
  tanggal: row.tanggal,
  kanal: row.kanal,
  noPesanan: row.noPesanan,
  sku: row.sku,
  namaProduk: row.namaProduk,
  qty: row.qty,
  hargaSatuan: row.hargaSatuan,
  diskonRp: row.diskonRp,
  revenue: row.revenue,
});

const previewSalesImport = async (file) => {
  if (!file) {
    throw new InvariantError(
      'Berkas laporan penjualan wajib diunggah pada field file'
    );
  }
  const rawRows = await readSalesFile(file);
  const { uniqueGroups, duplicateRows, rejectedRows } =
    await analyzeSalesRows(rawRows);
  const validRows = uniqueGroups
    .flatMap((g) => g.rows)
    .sort((a, b) => a.rowNumber - b.rowNumber);

  return {
    fileName: file.originalname || 'laporan_penjualan',
    summary: {
      totalRows: rawRows.length,
      readyCount: validRows.length,
      duplicateCount: duplicateRows.length,
      errorCount: rejectedRows.length,
      transactionCount: uniqueGroups.length,
      totalRevenue: round2(validRows.reduce((sum, r) => sum + r.revenue, 0)),
    },
    validRows: validRows.map(toPreviewRow),
    duplicateRows,
    rejectedRows,
  };
};

const commitSalesImport = async ({
  fileName,
  duplicateCount,
  validRows,
  rejectedRows,
  importedBy,
}) => {
  // Payload berasal dari client: validasi ulang penuh di server.
  const rawRows = validRows.map((row) => ({
    rowNumber: row.rowNumber,
    tanggal: row.tanggal,
    kanal: row.kanal,
    noPesanan: row.noPesanan,
    identifier: row.sku,
    qty: row.qty,
    hargaSatuan: row.hargaSatuan,
    diskonRp: row.diskonRp,
  }));
  const analysis = await analyzeSalesRows(rawRows);

  if (analysis.rejectedRows.length > 0) {
    const sample = analysis.rejectedRows
      .slice(0, 3)
      .map((r) => `baris ${r.rowNumber}: ${r.reason}`)
      .join('; ');
    throw new InvariantError(
      `Data import tidak valid, ulangi tahap preview. ${sample}`
    );
  }

  const acceptedRows = analysis.uniqueGroups.flatMap((g) => g.rows);
  if (validRows.length > 0 && acceptedRows.length === 0) {
    throw new InvariantError(
      'Semua baris valid sudah tercatat sebelumnya, tidak ada data baru untuk disimpan'
    );
  }

  const totalDuplicate = duplicateCount + analysis.duplicateRows.length;
  const records = buildSalesRecords(analysis.uniqueGroups, {
    berkas: fileName,
  });
  const kanalSet = [...new Set(acceptedRows.map((r) => r.kanal))];
  const dates = acceptedRows.map((r) => r.tanggal).sort();

  let status = 'berhasil';
  if (acceptedRows.length === 0) {
    status = 'gagal';
  } else if (totalDuplicate > 0 || rejectedRows.length > 0) {
    status = 'sebagian';
  }

  const { batch, stocks } = await transactionRepository.saveSalesRecords({
    ...records,
    rejectedRows,
    importBatch: {
      jenisImpor: 'penjualan',
      kanal: kanalSet.length === 1 ? kanalSet[0] : null,
      namaBerkas: fileName,
      periodeMulai: dates[0] || null,
      periodeAkhir: dates[dates.length - 1] || null,
      barisTotal: acceptedRows.length + totalDuplicate + rejectedRows.length,
      barisBaru: acceptedRows.length,
      barisDuplikat: totalDuplicate,
      barisDitolak: rejectedRows.length,
      status,
      diimporOleh: importedBy || null,
    },
  });

  return {
    batch: {
      batchId: batch.batch_id,
      jenisImpor: batch.jenis_impor,
      kanal: batch.kanal,
      berkas: batch.nama_berkas,
      periodeMulai: batch.periode_mulai,
      periodeAkhir: batch.periode_akhir,
      barisTotal: batch.baris_total,
      barisBaru: batch.baris_baru,
      barisDuplikat: batch.baris_duplikat,
      barisDitolak: batch.baris_ditolak,
      status: batch.status,
      diimporOleh: batch.diimpor_oleh,
      diimporPada: batch.diimpor_pada,
    },
    transactionCount: records.transactions.length,
    insertedItemCount: records.items.length,
    skippedDuplicateCount: analysis.duplicateRows.length,
    rejectedLoggedCount: rejectedRows.length,
    warnings: buildStockWarnings(stocks),
  };
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  previewSalesImport,
  commitSalesImport,
};
