const crypto = require('crypto');
const stockRepository = require('../repositories/stockRepository');
const { parseStockImportFile } = require('../utils/stockFileParser');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');

const IMPORT_MOVEMENT_ALIASES = {
  restok: 'RESTOCK_IN',
  restock_in: 'RESTOCK_IN',
  retur: 'RETURN_IN',
  return_in: 'RETURN_IN',
  rusak: 'DAMAGED_OUT',
  damaged_out: 'DAMAGED_OUT',
  penyesuaian: 'ADJUSTMENT',
  adjustment: 'ADJUSTMENT',
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
};

const isValidIsoDate = (dateStr) => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const getStocks = async (query) => {
  const [rows, total] = await Promise.all([
    stockRepository.findStocks(query),
    stockRepository.countStocks(query),
  ]);

  const data = rows.map((row) => ({
    sku: row.sku,
    productId: Number(row.product_id),
    nama: row.nama,
    kategori: row.kategori,
    isSellable: Boolean(row.is_sellable),
    isBundle: Boolean(row.is_bundle),
    isIndukPemecahan: Boolean(row.is_induk_pemecahan),
    satuanStok: row.satuan_stok,
    skuInduk: row.sku_induk || null,
    namaInduk: row.nama_induk || null,
    faktorKeInduk: toNullableNumber(row.faktor_ke_induk),
    currentStock: Number(row.stok_sistem),
    stokSistem: Number(row.stok_sistem),
    safetyStock: Number(row.safety_stock),
    reorderPoint: Number(row.reorder_point),
    tanggalOpname: row.tanggal_opname || null,
    stokFisik: toNullableNumber(row.stok_fisik),
    selisih: toNullableNumber(row.selisih),
    stokCukupHari: toNullableNumber(row.estimasi_hari_habis),
    status: row.status,
  }));

  return {
    data,
    meta: {
      limit: query.limit,
      offset: query.offset,
      total,
    },
  };
};

const getStockSummary = async () => {
  const row = await stockRepository.getStockSummary();

  return {
    totalSkuAktif: Number(row.total_sku_aktif),
    totalSkuKritis: Number(row.total_sku_kritis),
    prediksiRestock: Number(row.prediksi_restock),
    totalSelisihOpname: Number(row.total_selisih_opname),
    lastUpdatedDate: row.last_updated_date || null,
  };
};

const getStockAlerts = async () => {
  const [repackRows, bundleRows, restockRows] = await Promise.all([
    stockRepository.findRepackAlerts(),
    stockRepository.findBundleAlerts(),
    stockRepository.findRestockAlerts(),
  ]);

  const repack = repackRows.map((row) => ({
    sku: row.sku,
    namaProduk: row.nama_produk,
    satuanStok: row.satuan_stok,
    stokKemasanSaatIni: Number(row.stok_kemasan_saat_ini),
    ambangPemecahan: Number(row.ambang_pemecahan),
    skuInduk: row.sku_induk,
    namaInduk: row.nama_induk,
    satuanStokInduk: row.satuan_stok_induk,
    stokIndukSaatIni: Number(row.stok_induk_saat_ini),
    faktorKeInduk: Number(row.faktor_ke_induk),
    saranQtyKemasan: Number(row.saran_qty_kemasan),
    saranQtyInduk: Number(row.saran_qty_induk),
    statusInduk: row.status_induk,
  }));

  const assemble = bundleRows.map((row) => ({
    skuPaket: row.sku_paket,
    namaPaket: row.nama_paket,
    satuanStok: row.satuan_stok,
    stokPaketJadi: Number(row.stok_paket_jadi),
    maksPaketBisaDirakit: Number(row.maks_paket_bisa_dirakit),
    perluDirakit: Boolean(row.perlu_dirakit),
  }));

  const restock = restockRows.map((row) => ({
    sku: row.sku,
    nama: row.nama,
    kategori: row.kategori,
    satuanStok: row.satuan_stok,
    satuanBeli: row.satuan_beli,
    isiPerPembelian: Number(row.isi_per_pembelian),
    supplierUtama: row.supplier_utama,
    namaSupplier: row.nama_supplier,
    leadTimeHari: Number(row.lead_time_hari),
    stokSaatIni: Number(row.stok_saat_ini),
    stokPengaman: Number(row.stok_pengaman),
    titikPesanUlang: Number(row.titik_pesan_ulang),
    prediksiKebutuhan30Hari: Number(row.prediksi_kebutuhan_30_hari),
    selisihKebutuhanStok: Number(row.selisih_kebutuhan_stok),
    saranJumlahBeli: Number(row.saran_jumlah_beli),
  }));

  return {
    summary: {
      repackCount: repack.length,
      assembleCount: assemble.length,
      restockCount: restock.length,
    },
    repack,
    assemble,
    restock,
  };
};

const getStockMovements = async ({ sku, limit, offset }) => {
  const productHeader = await stockRepository.findProductStockHeader(sku);
  if (!productHeader) {
    throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
  }

  const [rows, total] = await Promise.all([
    stockRepository.findStockMovements({ sku, limit, offset }),
    stockRepository.countStockMovements(sku),
  ]);

  const movements = rows.map((row) => ({
    movementId: Number(row.movement_id),
    tanggal: row.tanggal,
    orderDate: row.order_date || null,
    sku: row.sku,
    namaProduk: row.nama_produk,
    satuanStok: row.satuan_stok,
    jenis: row.jenis,
    arah: row.arah,
    keteranganJenis: row.keterangan_jenis,
    qty: Number(row.qty),
    saldoBerjalan: Number(row.saldo_berjalan),
    ref: row.ref || null,
    sumber: row.sumber || null,
    batchId: toNullableNumber(row.batch_id),
  }));

  return {
    product: {
      sku: productHeader.sku,
      productId: Number(productHeader.product_id),
      nama: productHeader.nama,
      kategori: productHeader.kategori,
      satuanStok: productHeader.satuan_stok,
      isActive: Boolean(productHeader.is_active),
      isSellable: Boolean(productHeader.is_sellable),
      isBundle: Boolean(productHeader.is_bundle),
      isIndukPemecahan: Boolean(productHeader.is_induk_pemecahan),
      stokSaatIni: Number(productHeader.stok_saat_ini),
    },
    movements,
    meta: {
      limit,
      offset,
      total,
    },
  };
};

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const MAX_SUMBER_LENGTH = 200;
const clipText = (value, maxLength) =>
  value && value.length > maxLength
    ? `${value.slice(0, maxLength - 3)}...`
    : value;

/**
 * Mengubah item permintaan menjadi daftar operasi pemecahan (repack) yang seragam.
 * Mendukung dua bentuk payload:
 *  - Mode kemasan: { sku: <SKU kemasan>, jenis: 'repack', qty }
 *  - Mode induk  : { sku: <SKU induk>, jenis: 'repack', repackItems: [{ skuKemasan, qtyKemasan }] }
 */
const expandRepackItem = (item) => {
  if (item.repackItems && item.repackItems.length > 0) {
    return item.repackItems.map((sub) => ({
      skuKemasan: sub.skuKemasan,
      qtyKemasan: sub.qtyKemasan,
      skuIndukDiminta: item.sku,
    }));
  }

  return [
    { skuKemasan: item.sku, qtyKemasan: item.qty, skuIndukDiminta: null },
  ];
};

const createBatchMovements = async ({ tanggal, items }) => {
  // 1. Kumpulkan semua SKU yang disebut di payload (termasuk kemasan repack).
  const requestedSkus = new Set();
  items.forEach((item) => {
    requestedSkus.add(item.sku);
    if (item.jenis === 'SPLIT') {
      expandRepackItem(item).forEach((op) => requestedSkus.add(op.skuKemasan));
    }
  });

  const initialProducts = await stockRepository.findProductsBySkus([
    ...requestedSkus,
  ]);
  const productMap = new Map(initialProducts.map((p) => [p.sku, p]));

  const ensureActiveProduct = (sku, label = 'Produk') => {
    const product = productMap.get(sku);
    if (!product) {
      throw new NotFoundError(`${label} dengan SKU ${sku} tidak ditemukan`);
    }
    if (!product.is_active) {
      throw new InvariantError(`${label} ${sku} sudah nonaktif (discontinue)`);
    }
    return product;
  };

  requestedSkus.forEach((sku) => ensureActiveProduct(sku));

  // 2. Validasi konfigurasi repack & paket, kumpulkan SKU induk / komponen tambahan.
  const extraParentSkus = new Set();
  const bundleSkus = new Set();

  items.forEach((item) => {
    const product = productMap.get(item.sku);

    if (item.jenis === 'SPLIT') {
      expandRepackItem(item).forEach((op) => {
        const kemasan = productMap.get(op.skuKemasan);
        if (
          !kemasan.sku_induk ||
          !kemasan.faktor_ke_induk ||
          Number(kemasan.faktor_ke_induk) <= 0
        ) {
          throw new InvariantError(
            `Produk ${kemasan.sku} tidak memiliki konfigurasi bahan induk pemecahan`
          );
        }
        if (op.skuIndukDiminta && kemasan.sku_induk !== op.skuIndukDiminta) {
          throw new InvariantError(
            `Produk ${kemasan.sku} bukan hasil pemecahan dari ${op.skuIndukDiminta}`
          );
        }
        if (!productMap.has(kemasan.sku_induk)) {
          extraParentSkus.add(kemasan.sku_induk);
        }
      });
    }

    if (item.jenis === 'ASSEMBLE') {
      if (!product.is_bundle) {
        throw new InvariantError(
          `Produk ${item.sku} bukan produk paket (bundle)`
        );
      }
      bundleSkus.add(product.sku);
    }
  });

  if (extraParentSkus.size > 0) {
    const parentProducts = await stockRepository.findProductsBySkus([
      ...extraParentSkus,
    ]);
    parentProducts.forEach((p) => productMap.set(p.sku, p));
    extraParentSkus.forEach((parentSku) =>
      ensureActiveProduct(parentSku, 'Produk induk')
    );
  }

  const bundleComponentsMap = new Map();
  const componentSkus = [];

  if (bundleSkus.size > 0) {
    const components = await stockRepository.findBundleComponentsBySkus([
      ...bundleSkus,
    ]);

    components.forEach((comp) => {
      if (!comp.komponen_aktif) {
        throw new InvariantError(
          `Komponen paket ${comp.sku_komponen} pada paket ${comp.sku_paket} sudah nonaktif`
        );
      }
      if (!bundleComponentsMap.has(comp.sku_paket)) {
        bundleComponentsMap.set(comp.sku_paket, []);
      }
      bundleComponentsMap.get(comp.sku_paket).push(comp);
      componentSkus.push(comp.sku_komponen);
    });

    bundleSkus.forEach((bSku) => {
      if (!bundleComponentsMap.has(bSku)) {
        throw new InvariantError(
          `Komponen untuk paket ${bSku} belum dikonfigurasi`
        );
      }
    });
  }

  // 3. Simulasikan saldo agar mutasi keluar tidak membuat stok negatif.
  const allInvolvedSkus = [
    ...new Set([...productMap.keys(), ...componentSkus]),
  ];
  const currentStocks =
    await stockRepository.findCurrentStocksBySkus(allInvolvedSkus);
  const simulatedStockMap = new Map(
    currentStocks.map((s) => [s.sku, Number(s.stok)])
  );

  const getSimStock = (sku) => simulatedStockMap.get(sku) || 0;
  const adjustSimStock = (sku, delta) => {
    const nextVal = round2(getSimStock(sku) + delta);
    if (nextVal < 0) {
      throw new InvariantError(
        `Stok ${sku} tidak mencukupi (tersedia: ${getSimStock(sku)}, dibutuhkan: ${Math.abs(delta)})`
      );
    }
    simulatedStockMap.set(sku, nextVal);
  };

  const movementsToInsert = [];
  const pushMovement = (sku, jenis, qty, ref, sumber) => {
    movementsToInsert.push({
      tanggal,
      sku,
      jenis,
      qty: round2(qty),
      ref,
      sumber: clipText(sumber, MAX_SUMBER_LENGTH),
    });
  };

  let repackOperations = 0;
  let assembleOperations = 0;
  // Token unik per permintaan agar riwayat dapat mengelompokkan satu kali simpan.
  const batchRefPrefix = `BATCH-${tanggal}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  items.forEach((item, idx) => {
    const product = productMap.get(item.sku);
    const qty = round2(item.qty);
    const { catatan } = item;
    const itemRef = `${batchRefPrefix}-${idx + 1}`;

    switch (item.jenis) {
      case 'RESTOCK_IN':
        adjustSimStock(product.sku, qty);
        pushMovement(
          product.sku,
          'RESTOCK_IN',
          qty,
          itemRef,
          catatan || 'Restok manual'
        );
        break;

      case 'RETURN_IN':
        adjustSimStock(product.sku, qty);
        pushMovement(
          product.sku,
          'RETURN_IN',
          qty,
          itemRef,
          catatan || 'Retur barang masuk'
        );
        break;

      case 'DAMAGED_OUT':
        adjustSimStock(product.sku, -qty);
        pushMovement(
          product.sku,
          'DAMAGED_OUT',
          -qty,
          itemRef,
          catatan || 'Barang rusak / susut'
        );
        break;

      case 'SPLIT':
        expandRepackItem(item).forEach((op) => {
          const kemasan = productMap.get(op.skuKemasan);
          const qtyKemasan = round2(op.qtyKemasan);
          const qtyInduk = round2(qtyKemasan * Number(kemasan.faktor_ke_induk));

          adjustSimStock(kemasan.sku_induk, -qtyInduk);
          adjustSimStock(kemasan.sku, qtyKemasan);

          pushMovement(
            kemasan.sku_induk,
            'SPLIT_OUT',
            -qtyInduk,
            itemRef,
            catatan || `Pemecahan ke ${kemasan.sku}`
          );
          pushMovement(
            kemasan.sku,
            'SPLIT_IN',
            qtyKemasan,
            itemRef,
            catatan || `Pemecahan dari ${kemasan.sku_induk}`
          );
          repackOperations += 1;
        });
        break;

      case 'ASSEMBLE':
        bundleComponentsMap.get(product.sku).forEach((comp) => {
          const compOut = round2(qty * Number(comp.qty_komponen_per_paket));
          adjustSimStock(comp.sku_komponen, -compOut);
          pushMovement(
            comp.sku_komponen,
            'ASSEMBLE_OUT',
            -compOut,
            itemRef,
            catatan || `Perakitan paket ${product.sku}`
          );
        });
        adjustSimStock(product.sku, qty);
        pushMovement(
          product.sku,
          'ASSEMBLE_IN',
          qty,
          itemRef,
          catatan || `Hasil perakitan paket ${product.sku}`
        );
        assembleOperations += 1;
        break;

      default:
        throw new InvariantError(`Jenis mutasi "${item.jenis}" tidak didukung`);
    }
  });

  const { insertedRows, updatedStocks } =
    await stockRepository.insertStockMovementsBatch(movementsToInsert);

  return {
    summary: {
      totalMovementsCreated: insertedRows.length,
      repackOperations,
      assembleOperations,
    },
    movements: insertedRows.map((row) => ({
      movementId: Number(row.movement_id),
      tanggal: row.tanggal,
      sku: row.sku,
      jenis: row.jenis,
      qty: Number(row.qty),
      ref: row.ref,
      sumber: row.sumber,
    })),
    updatedStocks: updatedStocks.map((s) => ({
      sku: s.sku,
      currentStock: Number(s.stok),
    })),
  };
};

const getOpnameSheet = async ({ level, search }) => {
  const rows = await stockRepository.findOpnameSheet({ level, search });

  const items = rows.map((row) => {
    const isInduk = level === 'induk';
    const isiPerKarung = isInduk ? Number(row.isi_per_pembelian) || 50 : null;
    const satuanTampil = isInduk ? 'karung' : row.satuan_stok;
    const stokSistemBase = Number(row.stok_sistem);
    const stokSistemTampil = isInduk
      ? Number((stokSistemBase / isiPerKarung).toFixed(4))
      : stokSistemBase;

    return {
      sku: row.sku,
      productId: Number(row.product_id),
      nama: row.nama,
      kategori: row.kategori,
      isSellable: Boolean(row.is_sellable),
      isBundle: Boolean(row.is_bundle),
      isIndukPemecahan: Boolean(row.is_induk_pemecahan),
      satuanStok: row.satuan_stok,
      satuanTampil,
      isiPerKarung,
      stokSistem: stokSistemBase,
      stokSistemTampil,
      tanggalOpnameTerakhir: row.tanggal_opname_terakhir || null,
      stokFisikTerakhir: toNullableNumber(row.stok_fisik_terakhir),
      selisihTerakhir: toNullableNumber(row.selisih_terakhir),
      alasanSelisihTerakhir: row.alasan_selisih_terakhir || null,
    };
  });

  return {
    level,
    totalItems: items.length,
    items,
  };
};

const getOpnameHistory = async ({ sku, tanggal, limit, offset }) => {
  const [rows, total] = await Promise.all([
    stockRepository.findOpnameHistory({ sku, tanggal, limit, offset }),
    stockRepository.countOpnameHistory({ sku, tanggal }),
  ]);

  const data = rows.map((row) => ({
    tanggal: row.tanggal,
    sku: row.sku,
    namaProduk: row.nama_produk,
    isIndukPemecahan: Boolean(row.is_induk_pemecahan),
    isiPerKarung: row.is_induk_pemecahan
      ? Number(row.isi_per_pembelian) || 50
      : null,
    stokFisik: Number(row.stok_fisik),
    stokSistem: Number(row.stok_sistem),
    selisih: Number(row.selisih),
    satuanStok: row.satuan_stok,
    alasanSelisih: row.alasan_selisih || null,
    catatan: row.catatan || null,
    aturanSku: row.aturan_sku || null,
    berkas: row.berkas || null,
    batchId: toNullableNumber(row.batch_id),
  }));

  return {
    data,
    meta: {
      limit,
      offset,
      total,
    },
  };
};

const submitStockOpname = async ({ tanggal, level, items }) => {
  const skus = [...new Set(items.map((item) => item.sku))];
  const products = await stockRepository.findProductsBySkus(skus);
  const productMap = new Map(products.map((p) => [p.sku, p]));

  skus.forEach((sku) => {
    const product = productMap.get(sku);
    if (!product) {
      throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
    }
    if (!product.is_active) {
      throw new InvariantError(`Produk ${sku} sudah nonaktif (discontinue)`);
    }
    if (level === 'induk' && !product.is_induk_pemecahan) {
      throw new InvariantError(`SKU ${sku} bukan bahan induk pemecahan`);
    }
    if (level === 'sku' && product.is_induk_pemecahan) {
      throw new InvariantError(
        `SKU ${sku} adalah bahan induk; gunakan level "induk"`
      );
    }
  });

  const duplicateOpnameSkus = await stockRepository.findExistingOpnameOnDate(
    tanggal,
    skus
  );
  if (duplicateOpnameSkus.length > 0) {
    throw new InvariantError(
      `Stok opname pada tanggal ${tanggal} sudah pernah dicatat untuk SKU: ${duplicateOpnameSkus.join(', ')}`
    );
  }

  const currentStocks = await stockRepository.findCurrentStocksBySkus(skus);
  const stockMap = new Map(currentStocks.map((s) => [s.sku, Number(s.stok)]));

  const entries = items.map((item) => {
    const product = productMap.get(item.sku);
    const stokSistem = stockMap.get(item.sku) || 0;
    const isiPerKarung = Number(product.isi_per_pembelian) || 50;
    const stokFisik = round2(
      level === 'induk'
        ? Number(item.stokFisik) * isiPerKarung
        : Number(item.stokFisik)
    );
    const selisih = round2(stokFisik - stokSistem);
    const alasanSelisih = item.alasanSelisih
      ? String(item.alasanSelisih).trim()
      : null;
    const catatan = item.catatan ? String(item.catatan).trim() : null;

    if (selisih !== 0 && !alasanSelisih) {
      throw new InvariantError(
        `Alasan selisih wajib diisi untuk SKU ${item.sku} karena terdapat selisih stok (${selisih})`
      );
    }

    const labelAlasan = alasanSelisih || 'Sesuai';
    const sumber = clipText(
      catatan
        ? `Stok Opname (${labelAlasan}): ${catatan}`
        : `Stok Opname (${labelAlasan})`,
      MAX_SUMBER_LENGTH
    );

    return {
      sku: item.sku,
      stokFisik,
      stokSistem,
      selisih,
      satuanStok: product.satuan_stok,
      catatan,
      alasanSelisih,
      aturanSku: level === 'induk' ? 'INDUK_KARUNG' : 'SKU_SATUAN',
      ref: `OPNAME-${tanggal}-${item.sku}`,
      sumber,
    };
  });

  const { insertedOpnames, insertedAdjustments } =
    await stockRepository.saveOpnameSession({
      tanggal,
      entries,
    });

  return {
    tanggal,
    level,
    summary: {
      totalChecked: insertedOpnames.length,
      totalWithDiscrepancy: insertedAdjustments.length,
      totalMatched: insertedOpnames.length - insertedAdjustments.length,
    },
    opnames: insertedOpnames.map((row) => ({
      tanggal: row.tanggal,
      sku: row.sku,
      stokFisik: Number(row.stok_fisik),
      stokSistem: Number(row.stok_sistem),
      selisih: Number(row.selisih),
      satuanStok: row.satuan_stok,
      alasanSelisih: row.alasan_selisih || null,
      catatan: row.catatan || null,
    })),
    adjustments: insertedAdjustments.map((adj) => ({
      movementId: Number(adj.movement_id),
      tanggal: adj.tanggal,
      sku: adj.sku,
      jenis: adj.jenis,
      qty: Number(adj.qty),
      ref: adj.ref,
      sumber: adj.sumber,
    })),
  };
};

const IMPORT_REF_PREFIX = 'IMPORT-';
const IMPORT_DEFAULT_SUMBER_PREFIX = 'Import Berkas (';

const movementFingerprint = ({ tanggal, sku, jenis, qty, note }) =>
  `${tanggal}|${sku}|${jenis}|${round2(qty)}|${String(note || '')
    .trim()
    .toLowerCase()}`;

// Baris import tanpa catatan disimpan dengan sumber default "Import Berkas (<nama berkas>)".
// Saat membandingkan, sumber default itu dianggap sebagai catatan kosong agar
// unggahan ulang berkas yang sama (walau beda nama berkas) tetap terdeteksi duplikat.
const noteFromStoredMovement = (movement) => {
  const ref = String(movement.ref || '');
  const sumber = String(movement.sumber || '');
  if (
    ref.startsWith(IMPORT_REF_PREFIX) &&
    sumber.startsWith(IMPORT_DEFAULT_SUMBER_PREFIX)
  ) {
    return '';
  }
  return sumber;
};

/**
 * Memisahkan baris import menjadi baris unik dan duplikat
 * (duplikat di dalam berkas yang sama ataupun sudah tercatat di database).
 */
const splitDuplicateImportRows = async (rows) => {
  if (rows.length === 0) {
    return { uniqueRows: [], duplicateRows: [] };
  }

  const dates = rows.map((r) => r.tanggal).sort();
  const existingMovements =
    await stockRepository.findExistingStockMovementsForDedup({
      minDate: dates[0],
      maxDate: dates[dates.length - 1],
      skus: [...new Set(rows.map((r) => r.sku))],
    });

  const dbFingerprints = new Set(
    existingMovements.map((m) =>
      movementFingerprint({ ...m, note: noteFromStoredMovement(m) })
    )
  );
  const fileFingerprints = new Set();
  const uniqueRows = [];
  const duplicateRows = [];

  rows.forEach((row) => {
    const fingerprint = movementFingerprint({ ...row, note: row.catatan });

    if (fileFingerprints.has(fingerprint)) {
      duplicateRows.push({
        row,
        reason: 'Baris duplikat di dalam berkas yang sama',
      });
    } else if (dbFingerprints.has(fingerprint)) {
      duplicateRows.push({
        row,
        reason: 'Mutasi identik sudah tercatat di database',
      });
    } else {
      fileFingerprints.add(fingerprint);
      uniqueRows.push(row);
    }
  });

  return { uniqueRows, duplicateRows };
};

const previewStockImport = async (file) => {
  if (!file) {
    throw new InvariantError('Berkas import stok wajib diunggah');
  }

  const parsed = await parseStockImportFile(file);
  const rawRows = Array.isArray(parsed) ? parsed : parsed.rows || [];
  const fileName =
    (parsed && parsed.fileName) || file.originalname || 'import_stok.csv';

  if (rawRows.length === 0) {
    throw new InvariantError('Berkas tidak memiliki baris data untuk diproses');
  }

  const upperSkus = [];
  const lowerTexts = [];

  rawRows.forEach((row) => {
    const rawIdentifier = String(
      row.sku || row.produk || row.namaProduk || ''
    ).trim();
    if (rawIdentifier) {
      upperSkus.push(rawIdentifier.toUpperCase());
      lowerTexts.push(rawIdentifier.toLowerCase());
    }
  });

  const [directProducts, aliases] = await Promise.all([
    upperSkus.length > 0
      ? stockRepository.findProductsBySkus([...new Set(upperSkus)])
      : [],
    lowerTexts.length > 0
      ? stockRepository.findProductAliasesByTexts([...new Set(lowerTexts)])
      : [],
  ]);

  const productMap = new Map(
    directProducts.map((p) => [p.sku.toUpperCase(), p])
  );
  const aliasMap = new Map(
    aliases.map((a) => [a.normalized_teks, a.sku_hasil.toUpperCase()])
  );

  const missingAliasSkus = [
    ...new Set(aliases.map((a) => a.sku_hasil.toUpperCase())),
  ].filter((sku) => !productMap.has(sku));

  if (missingAliasSkus.length > 0) {
    const aliasProducts =
      await stockRepository.findProductsBySkus(missingAliasSkus);
    aliasProducts.forEach((p) => productMap.set(p.sku.toUpperCase(), p));
  }

  const candidateValidRows = [];
  const rejectedRows = [];

  rawRows.forEach((row, idx) => {
    const rowNumber = row.rowNumber || idx + 2;
    const tanggal = String(row.tanggal || '').trim();
    const rawIdentifier = String(
      row.sku || row.produk || row.namaProduk || ''
    ).trim();
    const rawJenis = String(row.jenis || '').trim();
    const rawQty = row.qty;
    const catatan =
      row.catatan !== undefined && row.catatan !== null
        ? String(row.catatan).trim()
        : '';

    const rawText =
      row.rawText ||
      [tanggal, rawIdentifier, rawJenis, rawQty, catatan]
        .filter(
          (val) =>
            val !== undefined && val !== null && String(val).trim() !== ''
        )
        .join(' | ');

    if (!isValidIsoDate(tanggal)) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `Format tanggal "${tanggal}" tidak valid (gunakan YYYY-MM-DD)`,
      });
      return;
    }

    const resolvedSkuKey = productMap.has(rawIdentifier.toUpperCase())
      ? rawIdentifier.toUpperCase()
      : aliasMap.get(rawIdentifier.toLowerCase());

    const product = resolvedSkuKey ? productMap.get(resolvedSkuKey) : null;

    if (!product) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `SKU "${rawIdentifier}" tidak ditemukan di katalog`,
      });
      return;
    }

    if (!product.is_active) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `Produk "${product.sku}" sudah nonaktif`,
      });
      return;
    }

    const normalizedJenis = IMPORT_MOVEMENT_ALIASES[rawJenis.toLowerCase()];
    if (!normalizedJenis) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `Jenis mutasi "${rawJenis}" tidak valid (gunakan: restok, retur, rusak, penyesuaian)`,
      });
      return;
    }

    const parsedQty = Number(rawQty);
    if (!Number.isFinite(parsedQty) || parsedQty === 0) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `Jumlah qty "${rawQty}" harus berupa angka tidak nol`,
      });
      return;
    }

    if (normalizedJenis !== 'ADJUSTMENT' && parsedQty < 0) {
      rejectedRows.push({
        rowNumber,
        rawText,
        reason: `Jumlah qty "${rawQty}" untuk jenis ${rawJenis} harus lebih besar dari 0`,
      });
      return;
    }

    const signedQty =
      normalizedJenis === 'DAMAGED_OUT' ? -Math.abs(parsedQty) : parsedQty;

    candidateValidRows.push({
      rowNumber,
      tanggal,
      sku: product.sku,
      namaProduk: product.nama,
      satuanStok: product.satuan_stok,
      jenis: normalizedJenis,
      qty: signedQty,
      catatan: catatan || null,
      rawText,
    });
  });

  const { uniqueRows, duplicateRows: duplicates } =
    await splitDuplicateImportRows(candidateValidRows);

  const validRows = uniqueRows.map((row) => ({
    rowNumber: row.rowNumber,
    tanggal: row.tanggal,
    sku: row.sku,
    namaProduk: row.namaProduk,
    satuanStok: row.satuanStok,
    jenis: row.jenis,
    qty: row.qty,
    catatan: row.catatan,
  }));
  const duplicateRows = duplicates.map(({ row, reason }) => ({
    rowNumber: row.rowNumber,
    rawText: row.rawText,
    reason,
  }));

  return {
    fileName,
    summary: {
      totalRows: rawRows.length,
      readyCount: validRows.length,
      duplicateCount: duplicateRows.length,
      errorCount: rejectedRows.length,
    },
    validRows,
    duplicateRows,
    rejectedRows,
  };
};

const commitStockImport = async ({
  fileName,
  duplicateCount,
  validRows,
  rejectedRows,
  importedBy,
}) => {
  if (validRows.length > 0) {
    const skus = [...new Set(validRows.map((r) => r.sku))];
    const products = await stockRepository.findProductsBySkus(skus);
    const productMap = new Map(products.map((p) => [p.sku, p]));

    validRows.forEach((row) => {
      const product = productMap.get(row.sku);
      if (!product) {
        throw new NotFoundError(`Produk dengan SKU ${row.sku} tidak ditemukan`);
      }
      if (!product.is_active) {
        throw new InvariantError(
          `Produk ${row.sku} sudah nonaktif (discontinue)`
        );
      }
    });
  }

  // Cek ulang duplikat di server: payload commit berasal dari client sehingga
  // tidak boleh dipercaya begitu saja (mis. tombol simpan ditekan dua kali).
  const { uniqueRows, duplicateRows } =
    await splitDuplicateImportRows(validRows);
  const totalDuplicate = duplicateCount + duplicateRows.length;

  if (uniqueRows.length === 0 && validRows.length > 0) {
    throw new InvariantError(
      'Semua baris valid sudah tercatat sebelumnya, tidak ada data baru untuk disimpan'
    );
  }

  const totalRows = uniqueRows.length + totalDuplicate + rejectedRows.length;
  const { batch, insertedMovements } =
    await stockRepository.commitStockImportBatch({
      fileName,
      totalRows,
      validRows: uniqueRows,
      duplicateCount: totalDuplicate,
      rejectedRows,
      importedBy,
    });

  return {
    batch: {
      batchId: Number(batch.batch_id),
      jenisImpor: batch.jenis_impor,
      berkas: batch.nama_berkas,
      barisTotal: Number(batch.baris_total),
      barisBaru: Number(batch.baris_baru),
      barisDuplikat: Number(batch.baris_duplikat),
      barisDitolak: Number(batch.baris_ditolak),
      status: batch.status,
      diimporOleh: batch.diimpor_oleh,
      diimporPada: batch.diimpor_pada,
    },
    insertedCount: insertedMovements.length,
    skippedDuplicateCount: duplicateRows.length,
    rejectedLoggedCount: rejectedRows.length,
  };
};

module.exports = {
  getStocks,
  getStockSummary,
  getStockAlerts,
  getStockMovements,
  createBatchMovements,
  getOpnameSheet,
  getOpnameHistory,
  submitStockOpname,
  previewStockImport,
  commitStockImport,
};
