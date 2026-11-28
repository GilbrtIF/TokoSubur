const dataQualityRepository = require('../repositories/dataQualityRepository');
const { InvariantError, NotFoundError } = require('../exceptions');
const { toNumberOrNull } = require('../utils/format');

const mapBatch = (row) => ({
  batchId: row.batch_id,
  jenisImpor: row.jenis_impor,
  kanal: row.kanal,
  namaBerkas: row.nama_berkas,
  periodeMulai: row.periode_mulai,
  periodeAkhir: row.periode_akhir,
  barisTotal: row.baris_total,
  barisBaru: row.baris_baru,
  barisDuplikat: row.baris_duplikat,
  barisDitolak: row.baris_ditolak,
  status: row.status,
  diimporOleh: row.diimpor_oleh,
  diimporPada: row.diimpor_pada,
});

const mapMapping = (row) => ({
  sumber: row.sumber,
  teks: row.teks,
  contohTeksAsli: row.contoh_teks_asli,
  jumlahBaris: row.jumlah_baris,
  barisMasuk: row.baris_masuk,
  aturan: row.aturan,
  skuHasil: row.sku_hasil,
  namaProduk: row.nama_produk || null,
  status: row.status,
});

const getStatus = async () => {
  const [channels, counts, byReason, byStatus, recent] = await Promise.all([
    dataQualityRepository.getChannelStatus(),
    dataQualityRepository.getQualityCounts(),
    dataQualityRepository.getRejectedByReason(),
    dataQualityRepository.getMappingByStatus(),
    dataQualityRepository.findImportBatches({ limit: 5, offset: 0 }),
  ]);

  return {
    kanal: channels.map((row) => ({
      kanal: row.kanal,
      jenis: row.jenis,
      periodeMulai: row.periode_mulai || null,
      dataCompleteUntil: row.data_complete_until || null,
      transaksiTerakhir: row.transaksi_terakhir || null,
      importTerakhir: row.import_terakhir || null,
      catatan: row.catatan || null,
    })),
    ringkasan: {
      totalBarisDitolak: counts.total_ditolak,
      totalPenjualanAmbigu: counts.total_ambigu,
      totalMappingProduk: counts.total_mapping,
      mappingPerluDitinjau: counts.mapping_perlu_tinjau,
    },
    ditolakPerAlasan: byReason.map((row) => ({
      jenisAlasan: row.jenis_alasan,
      jumlah: row.jumlah,
    })),
    mappingPerStatus: byStatus.map((row) => ({
      status: row.status,
      jumlah: row.jumlah,
      jumlahBaris: row.jumlah_baris,
    })),
    importTerakhir: recent.rows.map(mapBatch),
  };
};

const getImportBatches = async (filter) => {
  const { rows, total } = await dataQualityRepository.findImportBatches(filter);
  return {
    data: rows.map(mapBatch),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const getRejectedRows = async (filter) => {
  const { rows, total } = await dataQualityRepository.findRejectedRows(filter);
  return {
    data: rows.map((row) => ({
      tahap: row.tahap,
      berkas: row.berkas,
      barisExcel: row.baris_excel,
      teks: row.teks,
      alasan: row.alasan,
      rincianHarga: row.rincian_harga,
      jenisAlasan: row.jenis_alasan,
      batchId: row.batch_id,
    })),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const getAmbiguousSales = async (filter) => {
  const { rows, total, totalSubtotal } =
    await dataQualityRepository.findAmbiguousSales(filter);
  return {
    data: rows.map((row) => ({
      tanggal: row.tanggal,
      bulan: row.bulan,
      kanal: row.kanal,
      teksAsli: row.teks_asli,
      qty: toNumberOrNull(row.qty),
      subtotal: toNumberOrNull(row.subtotal),
      skuKandidat: String(row.sku_kandidat || '')
        .split(/[|,;]/)
        .map((sku) => sku.trim())
        .filter(Boolean),
      alasan: row.alasan,
      berkas: row.berkas,
      barisExcel: row.baris_excel,
    })),
    meta: { limit: filter.limit, offset: filter.offset, total, totalSubtotal },
  };
};

const getProductMappings = async (filter) => {
  const { rows, total } =
    await dataQualityRepository.findProductMappings(filter);
  return {
    data: rows.map(mapMapping),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const saveProductMapping = async ({ sumber, teks, skuHasil, aturan }) => {
  const product = await dataQualityRepository.findProduct(skuHasil);
  if (!product) {
    throw new NotFoundError(`Produk dengan SKU ${skuHasil} tidak ditemukan`);
  }
  if (!product.is_active) {
    throw new InvariantError(`Produk ${skuHasil} sudah nonaktif`);
  }

  const { row, created } = await dataQualityRepository.upsertProductMapping({
    sumber,
    teks: teks.trim().toLowerCase(),
    contohTeksAsli: teks.trim(),
    skuHasil,
    aturan: aturan || 'MANUAL_UI',
  });
  return { created, mapping: { ...mapMapping(row), namaProduk: product.nama } };
};

module.exports = {
  getStatus,
  getImportBatches,
  getRejectedRows,
  getAmbiguousSales,
  getProductMappings,
  saveProductMapping,
};
