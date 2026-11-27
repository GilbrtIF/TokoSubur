const forecastRepository = require('../repositories/forecastRepository');
const { InvariantError, NotFoundError } = require('../exceptions');
const { toNumberOrNull, toNumber } = require('../utils/format');
const { buildCsv } = require('../utils/exportBuilder');

const MAX_TRAINING_ROWS = 500000;

// Sama dengan rumus view v_keyakinan_model: 100 - WAPE (minimal 0).
const estimateAccuracy = (row) => {
  if (row.estimasi_akurasi_persen !== undefined) {
    return toNumberOrNull(row.estimasi_akurasi_persen);
  }
  if (row.wape === null || row.wape === undefined) {
    return null;
  }
  return Math.round(Math.max(100 - Number(row.wape), 0) * 100) / 100;
};

const mapModelRun = (row) => ({
  runId: row.run_id,
  namaModel: row.nama_model,
  versiModel: row.versi_model,
  dilatihPada: row.dilatih_pada,
  trainMulai: row.train_mulai,
  trainSelesai: row.train_selesai,
  testMulai: row.test_mulai,
  testSelesai: row.test_selesai,
  wape: toNumberOrNull(row.wape),
  mape: toNumberOrNull(row.mape),
  rmse: toNumberOrNull(row.rmse),
  estimasiAkurasiPersen: estimateAccuracy(row),
  aktif: Boolean(row.aktif),
  jumlahPrediksi:
    row.jumlah_prediksi === undefined ? undefined : row.jumlah_prediksi,
});

const mapForecast = (row) => ({
  forecastId: row.forecast_id,
  runId: row.run_id,
  sku: row.sku,
  nama: row.nama,
  satuanStok: row.satuan_stok,
  kanal: row.kanal || null,
  periode: row.periode,
  granularitas: row.granularitas,
  qtyPrediksi: Number(row.qty_prediksi),
  qtyBawah: toNumberOrNull(row.qty_bawah),
  qtyAtas: toNumberOrNull(row.qty_atas),
});

const getModels = async () => {
  const [runs, active] = await Promise.all([
    forecastRepository.findModelRuns(),
    forecastRepository.findActiveModel(),
  ]);
  return {
    modelAktif: active ? mapModelRun(active) : null,
    riwayat: runs.map(mapModelRun),
  };
};

const getForecasts = async (filter) => {
  if (filter.runId) {
    const run = await forecastRepository.findModelRun(filter.runId);
    if (!run) {
      throw new NotFoundError(`Model run ${filter.runId} tidak ditemukan`);
    }
  }
  const [rows, total, active] = await Promise.all([
    forecastRepository.findForecasts(filter),
    forecastRepository.countForecasts(filter),
    forecastRepository.findActiveModel(),
  ]);
  return {
    data: rows.map(mapForecast),
    meta: {
      limit: filter.limit,
      offset: filter.offset,
      total,
      runId: filter.runId || (active ? active.run_id : null),
      modelAktifTersedia: Boolean(active),
    },
  };
};

const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Data grafik per SKU: penjualan aktual + prediksi model aktif. */
const getSkuForecastChart = async (sku, { historyDays }) => {
  const product = await forecastRepository.findProduct(sku);
  if (!product) {
    throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
  }
  const forecasts = await forecastRepository.findForecasts({
    sku,
    limit: 1000,
    offset: 0,
  });
  const firstForecast = forecasts.length ? forecasts[0].periode : null;
  const to = firstForecast
    ? addDays(firstForecast, -1)
    : new Date().toISOString().slice(0, 10);
  const actual = await forecastRepository.findActualSales({
    sku,
    from: addDays(to, -(historyDays - 1)),
    to,
  });

  return {
    produk: {
      sku: product.sku,
      nama: product.nama,
      satuanStok: product.satuan_stok,
      stokSaatIni: toNumber(product.stok),
    },
    aktual: actual.map((row) => ({
      tanggal: row.tanggal,
      qty: Number(row.qty),
      revenue: Number(row.revenue),
    })),
    prediksi: forecasts.map((row) => ({
      periode: row.periode,
      granularitas: row.granularitas,
      kanal: row.kanal || null,
      qtyPrediksi: Number(row.qty_prediksi),
      qtyBawah: toNumberOrNull(row.qty_bawah),
      qtyAtas: toNumberOrNull(row.qty_atas),
    })),
  };
};

const getDemandChanges = async (filter) => {
  const { rows, total } = await forecastRepository.findDemandChanges(filter);
  return {
    data: rows.map((row) => ({
      sku: row.sku,
      nama: row.nama,
      kategori: row.kategori,
      qtyAktual30Hari: Number(row.qty_aktual_30_hari),
      revenueAktual30Hari: Number(row.revenue_aktual_30_hari),
      qtyPrediksi30Hari: Number(row.qty_prediksi_30_hari),
      selisihQty: Number(row.selisih_qty),
      persentasePerubahan: toNumberOrNull(row.persentase_perubahan),
    })),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const getStockProjection = async (filter) => {
  const { rows, total } = await forecastRepository.findStockProjection(filter);
  return {
    data: rows.map((row) => ({
      sku: row.sku,
      nama: row.nama,
      satuanStok: row.satuan_stok,
      stokSaatIni: Number(row.stok_saat_ini),
      rataPermintaanHarian: Number(row.rata_permintaan_harian),
      totalQtyPrediksi: Number(row.total_qty_prediksi),
      estimasiHariHabis: row.estimasi_hari_habis,
      perkiraanTanggalHabis: row.perkiraan_tanggal_habis,
    })),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const validateForecastItems = async (items) => {
  const skus = [...new Set(items.map((item) => item.sku))];
  const [existingSkus, existingKanal] = await Promise.all([
    forecastRepository.findExistingSkus(skus),
    forecastRepository.findExistingKanal(),
  ]);
  const skuSet = new Set(existingSkus);
  const kanalMap = new Map(
    existingKanal.map((kanal) => [kanal.toLowerCase(), kanal])
  );

  const missing = skus.filter((sku) => !skuSet.has(sku));
  if (missing.length > 0) {
    throw new InvariantError(
      `SKU tidak ditemukan: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}`
    );
  }
  return items.map((item, index) => {
    if (!item.kanal) {
      return item;
    }
    const kanal = kanalMap.get(item.kanal.toLowerCase());
    if (!kanal) {
      throw new InvariantError(
        `forecasts[${index}].kanal "${item.kanal}" tidak terdaftar`
      );
    }
    return { ...item, kanal };
  });
};

const createModelRun = async ({ run, forecasts, aktifkan }) => {
  const items = await validateForecastItems(forecasts);
  const created = await forecastRepository.createModelRun(run);
  const inserted = await forecastRepository.insertForecasts(
    created.run_id,
    items
  );
  const finalRun = aktifkan
    ? await forecastRepository.activateModelRun(created.run_id)
    : created;
  return { model: mapModelRun(finalRun), insertedForecasts: inserted };
};

const appendForecasts = async (runId, forecasts) => {
  const run = await forecastRepository.findModelRun(runId);
  if (!run) {
    throw new NotFoundError(`Model run ${runId} tidak ditemukan`);
  }
  const items = await validateForecastItems(forecasts);
  const inserted = await forecastRepository.insertForecasts(runId, items);
  return { runId, insertedForecasts: inserted };
};

const activateModel = async (runId) => {
  const run = await forecastRepository.findModelRun(runId);
  if (!run) {
    throw new NotFoundError(`Model run ${runId} tidak ditemukan`);
  }
  const activated = await forecastRepository.activateModelRun(runId);
  return mapModelRun(activated);
};

const exportTrainingDataset = async ({ from, to }) => {
  const rows = await forecastRepository.findTrainingDataset({
    from,
    to,
    maxRows: MAX_TRAINING_ROWS,
  });
  return {
    fileName: `dataset_latih${from ? `_${from}` : ''}${to ? `_${to}` : ''}.csv`,
    buffer: buildCsv(
      rows.map((row) => ({
        ...row,
        qty: Number(row.qty),
        revenue: Number(row.revenue),
        is_stockout: row.is_stockout ? 1 : 0,
      })),
      ['tanggal', 'kanal', 'sku', 'qty', 'revenue', 'is_stockout'].map(
        (key) => ({ key, header: key })
      ),
      { bom: false }
    ),
    rowCount: rows.length,
  };
};

module.exports = {
  getModels,
  getForecasts,
  getSkuForecastChart,
  getDemandChanges,
  getStockProjection,
  createModelRun,
  appendForecasts,
  activateModel,
  exportTrainingDataset,
};
