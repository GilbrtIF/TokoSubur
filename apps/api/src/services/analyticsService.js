const analyticsRepository = require('../repositories/analyticsRepository');
const stockRepository = require('../repositories/stockRepository');
const { InvariantError } = require('../exceptions');
const { round2, toNumber } = require('../utils/format');
const { buildCsv, buildXlsx } = require('../utils/exportBuilder');

const DEFAULT_PERIOD_DAYS = 30;
const MAX_DAILY_POINTS = 400;
const MAX_EXPORT_ROWS = 100000;

const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const diffDays = (from, to) =>
  Math.round(
    (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000
  );

const todayJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date()
  );

const growthPercent = (current, previous) =>
  previous > 0 ? round2(((current - previous) / previous) * 100) : null;

/**
 * Menentukan periode laporan. Tanpa from/to -> 30 hari terakhir yang berakhir di
 * tanggal penjualan terakhir (data bersifat historis, bukan real-time).
 */
const resolvePeriod = async ({ from, to }) => {
  if (from && to) {
    return { from, to, isDefault: false };
  }
  if (from) {
    return {
      from,
      to: addDays(from, DEFAULT_PERIOD_DAYS - 1),
      isDefault: false,
    };
  }
  if (to) {
    return {
      from: addDays(to, -(DEFAULT_PERIOD_DAYS - 1)),
      to,
      isDefault: false,
    };
  }
  const range = await analyticsRepository.getDataRange();
  const end = range.tanggal_akhir || todayJakarta();
  return {
    from: addDays(end, -(DEFAULT_PERIOD_DAYS - 1)),
    to: end,
    isDefault: true,
  };
};

const previousPeriodOf = ({ from, to }) => {
  const length = diffDays(from, to) + 1;
  return { from: addDays(from, -length), to: addDays(from, -1) };
};

const mapTotals = (row) => ({
  revenue: toNumber(row.revenue),
  qty: row.qty,
  transaksi: row.transaksi,
  skuTerjual: row.sku_terjual,
});

const mapTopProduct = (row) => ({
  sku: row.sku,
  nama: row.nama,
  kategori: row.kategori,
  satuanStok: row.satuan_stok,
  revenue: toNumber(row.revenue),
  qty: row.qty,
  transaksi: row.transaksi,
});

const mapChannelShare = (rows) => {
  const totalRevenue = rows.reduce(
    (sum, row) => sum + toNumber(row.revenue),
    0
  );
  return rows.map((row) => ({
    kanal: row.kanal,
    jenis: row.jenis,
    revenue: toNumber(row.revenue),
    qty: row.qty,
    transaksi: row.transaksi,
    persentaseRevenue:
      totalRevenue > 0
        ? round2((toNumber(row.revenue) / totalRevenue) * 100)
        : 0,
  }));
};

const getDashboardSummary = async ({ from, to, kanal }) => {
  const period = await resolvePeriod({ from, to });
  const previous = previousPeriodOf(period);
  const filter = { ...period, kanal };

  const [
    current,
    before,
    daily,
    channels,
    topProducts,
    stockSummary,
    criticalStocks,
    restock,
  ] = await Promise.all([
    analyticsRepository.getSalesTotals(filter),
    analyticsRepository.getSalesTotals({ ...previous, kanal }),
    analyticsRepository.getSalesSeries(filter, 'harian'),
    analyticsRepository.getSalesByChannel(filter),
    analyticsRepository.getTopProducts(filter, { limit: 5, sortBy: 'revenue' }),
    stockRepository.getStockSummary(),
    stockRepository.findStocks({
      isSellable: null,
      status: 'kritis',
      search: null,
      limit: 5,
      offset: 0,
    }),
    stockRepository.findRestockAlerts(),
  ]);

  const now = mapTotals(current);
  const prev = mapTotals(before);

  return {
    periode: {
      from: period.from,
      to: period.to,
      isDefault: period.isDefault,
      kanal: kanal || null,
    },
    periodeSebelumnya: previous,
    cards: {
      omzet: {
        value: now.revenue,
        previous: prev.revenue,
        growthPercent: growthPercent(now.revenue, prev.revenue),
      },
      jumlahTransaksi: {
        value: now.transaksi,
        previous: prev.transaksi,
        growthPercent: growthPercent(now.transaksi, prev.transaksi),
      },
      qtyTerjual: {
        value: now.qty,
        previous: prev.qty,
        growthPercent: growthPercent(now.qty, prev.qty),
      },
      skuKritis: {
        value: Number(stockSummary.total_sku_kritis),
        prediksiRestock: Number(stockSummary.prediksi_restock),
      },
    },
    charts: {
      penjualanHarian: daily.map((row) => ({
        tanggal: row.periode,
        revenue: toNumber(row.revenue),
        qty: row.qty,
        transaksi: row.transaksi,
      })),
      penjualanPerKanal: mapChannelShare(channels),
    },
    lists: {
      produkTerlaris: topProducts.map(mapTopProduct),
      stokKritis: criticalStocks.map((row) => ({
        sku: row.sku,
        nama: row.nama,
        satuanStok: row.satuan_stok,
        stokSaatIni: toNumber(row.stok_sistem),
        reorderPoint: toNumber(row.reorder_point),
        status: row.status,
      })),
      rekomendasiRestok: restock.slice(0, 5).map((row) => ({
        sku: row.sku,
        nama: row.nama,
        namaSupplier: row.nama_supplier,
        stokSaatIni: toNumber(row.stok_saat_ini),
        saranJumlahBeli: toNumber(row.saran_jumlah_beli),
        satuanBeli: row.satuan_beli,
      })),
    },
  };
};

const getSalesAnalytics = async ({
  from,
  to,
  kanal,
  kategori,
  granularity,
}) => {
  const period = await resolvePeriod({ from, to });
  if (
    granularity === 'harian' &&
    diffDays(period.from, period.to) + 1 > MAX_DAILY_POINTS
  ) {
    throw new InvariantError(
      `Rentang lebih dari ${MAX_DAILY_POINTS} hari, gunakan granularity mingguan atau bulanan`
    );
  }
  const filter = { ...period, kanal, kategori };
  const previous = previousPeriodOf(period);

  const [series, seriesByChannel, totals, before, channels, categories] =
    await Promise.all([
      analyticsRepository.getSalesSeries(filter, granularity),
      analyticsRepository.getSalesSeriesByChannel(filter, granularity),
      analyticsRepository.getSalesTotals(filter),
      analyticsRepository.getSalesTotals({ ...previous, kanal, kategori }),
      analyticsRepository.getSalesByChannel(filter),
      analyticsRepository.getSalesByCategory(filter),
    ]);

  const channelMap = new Map();
  seriesByChannel.forEach((row) => {
    if (!channelMap.has(row.periode)) {
      channelMap.set(row.periode, {});
    }
    channelMap.get(row.periode)[row.kanal] = {
      revenue: toNumber(row.revenue),
      qty: row.qty,
    };
  });

  const now = mapTotals(totals);
  const prev = mapTotals(before);

  return {
    periode: {
      from: period.from,
      to: period.to,
      granularity,
      kanal: kanal || null,
      kategori: kategori || null,
    },
    ringkasan: {
      ...now,
      rataRataPerTransaksi:
        now.transaksi > 0 ? round2(now.revenue / now.transaksi) : 0,
      growthRevenuePercent: growthPercent(now.revenue, prev.revenue),
      growthQtyPercent: growthPercent(now.qty, prev.qty),
    },
    series: series.map((row) => ({
      periode: row.periode,
      revenue: toNumber(row.revenue),
      qty: row.qty,
      transaksi: row.transaksi,
      perKanal: channelMap.get(row.periode) || {},
    })),
    perKanal: mapChannelShare(channels),
    perKategori: categories.map((row) => ({
      kategori: row.kategori,
      revenue: toNumber(row.revenue),
      qty: row.qty,
    })),
  };
};

const getTopProducts = async ({ from, to, kanal, kategori, limit, sortBy }) => {
  const period = await resolvePeriod({ from, to });
  const rows = await analyticsRepository.getTopProducts(
    { ...period, kanal, kategori },
    { limit, sortBy }
  );
  return {
    periode: {
      from: period.from,
      to: period.to,
      kanal: kanal || null,
      kategori: kategori || null,
      sortBy,
    },
    items: rows.map(mapTopProduct),
  };
};

const EXPORT_COLUMNS = [
  { key: 'tanggal', header: 'Tanggal' },
  { key: 'transaction_id', header: 'ID Transaksi' },
  { key: 'kanal', header: 'Kanal' },
  { key: 'sku', header: 'SKU' },
  { key: 'nama', header: 'Nama Produk' },
  { key: 'kategori', header: 'Kategori' },
  { key: 'qty', header: 'Qty' },
  { key: 'harga_satuan', header: 'Harga Satuan' },
  { key: 'diskon_rp', header: 'Diskon (Rp)' },
  { key: 'revenue', header: 'Revenue' },
];

const exportSales = async ({ from, to, kanal, kategori, format }) => {
  const period = await resolvePeriod({ from, to });
  const filter = { ...period, kanal, kategori };
  const rows = (
    await analyticsRepository.getExportRows(filter, MAX_EXPORT_ROWS)
  ).map((row) => ({
    ...row,
    qty: Number(row.qty),
    harga_satuan: Number(row.harga_satuan),
    diskon_rp: Number(row.diskon_rp),
    revenue: Number(row.revenue),
  }));

  const baseName = `penjualan_${period.from}_${period.to}${kanal ? `_${kanal.replace(/[^A-Za-z0-9]/g, '')}` : ''}`;

  if (format === 'csv') {
    return {
      fileName: `${baseName}.csv`,
      contentType: 'text/csv; charset=utf-8',
      buffer: buildCsv(rows, EXPORT_COLUMNS),
      rowCount: rows.length,
    };
  }

  const [topProducts, channels] = await Promise.all([
    analyticsRepository.getTopProducts(filter, {
      limit: 50,
      sortBy: 'revenue',
    }),
    analyticsRepository.getSalesByChannel(filter),
  ]);

  return {
    fileName: `${baseName}.xlsx`,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: buildXlsx([
      { name: 'Penjualan', rows, columns: EXPORT_COLUMNS },
      {
        name: 'Top Produk',
        rows: topProducts.map(mapTopProduct),
        columns: [
          { key: 'sku', header: 'SKU' },
          { key: 'nama', header: 'Nama Produk' },
          { key: 'kategori', header: 'Kategori' },
          { key: 'qty', header: 'Qty' },
          { key: 'revenue', header: 'Revenue' },
          { key: 'transaksi', header: 'Jumlah Transaksi' },
        ],
      },
      {
        name: 'Per Kanal',
        rows: mapChannelShare(channels),
        columns: [
          { key: 'kanal', header: 'Kanal' },
          { key: 'revenue', header: 'Revenue' },
          { key: 'qty', header: 'Qty' },
          { key: 'transaksi', header: 'Jumlah Transaksi' },
          { key: 'persentaseRevenue', header: '% Revenue' },
        ],
      },
    ]),
    rowCount: rows.length,
  };
};

const getMarketplaceMetrics = async (filter) => {
  const [rows, summary] = await Promise.all([
    analyticsRepository.findMarketplaceMetrics(filter),
    analyticsRepository.summarizeMarketplaceMetrics(filter),
  ]);
  const ratio = (a, b) =>
    Number(b) > 0 ? round2((Number(a) / Number(b)) * 100) : null;

  return {
    data: rows.map((row) => ({
      periode: row.periode,
      periodeMulai: row.periode_mulai,
      periodeAkhir: row.periode_akhir,
      kanal: row.kanal,
      sku: row.sku,
      nama: row.nama,
      impresi: row.impresi,
      klik: row.klik,
      pesanan: row.pesanan,
      ctrPercent: ratio(row.klik, row.impresi),
      konversiPercent: ratio(row.pesanan, row.klik),
      rating: row.rating === null ? null : Number(row.rating),
      jumlahUlasan: row.jumlah_ulasan,
      hargaTayang: row.harga_tayang === null ? null : Number(row.harga_tayang),
      skuInferred: Boolean(row.sku_inferred),
    })),
    meta: {
      limit: filter.limit,
      offset: filter.offset,
      total: summary.total,
      totalImpresi: Number(summary.impresi),
      totalKlik: Number(summary.klik),
      totalPesanan: Number(summary.pesanan),
      ctrPercent: ratio(summary.klik, summary.impresi),
      konversiPercent: ratio(summary.pesanan, summary.klik),
    },
  };
};

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getTopProducts,
  exportSales,
  getMarketplaceMetrics,
};
