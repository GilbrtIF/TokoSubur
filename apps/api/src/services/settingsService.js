const settingsRepository = require('../repositories/settingsRepository');
const { InvariantError, NotFoundError } = require('../exceptions');
const { toNumberOrNull, toNumber } = require('../utils/format');

const mapSetting = (row) => ({
  sku: row.sku,
  nama: row.nama,
  kategori: row.kategori,
  satuanStok: row.satuan_stok,
  supplierUtama: row.supplier_utama,
  stokSaatIni: toNumber(row.stok_saat_ini),
  stokMinimumManual: toNumberOrNull(row.stok_minimum_manual),
  titikPesanUlang: toNumberOrNull(row.titik_pesan_ulang),
  stokPengaman: toNumberOrNull(row.stok_pengaman),
  leadTimeHari: row.lead_time_hari,
  sumberLeadTime: row.sumber_lead_time,
  ambangEfektif: toNumber(row.ambang_efektif),
  diperbaruiPada: row.diperbarui_pada,
});

const getReorderSettings = async (filter) => {
  const [rows, total] = await Promise.all([
    settingsRepository.findReorderSettings(filter),
    settingsRepository.countReorderSettings(filter),
  ]);
  return {
    data: rows.map(mapSetting),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const updateReorderSettings = async (items) => {
  const skus = items.map((item) => item.sku);
  const found = await settingsRepository.findActiveSkus(skus);
  const foundMap = new Map(found.map((row) => [row.sku, row]));

  skus.forEach((sku) => {
    const product = foundMap.get(sku);
    if (!product) {
      throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
    }
    if (!product.is_active) {
      throw new InvariantError(`Produk ${sku} sudah nonaktif`);
    }
  });

  items.forEach((item) => {
    const pengaman = item.stokPengaman;
    const titik = item.titikPesanUlang;
    if (
      pengaman !== undefined &&
      pengaman !== null &&
      titik !== undefined &&
      titik !== null &&
      titik < pengaman
    ) {
      throw new InvariantError(
        `titikPesanUlang ${item.sku} tidak boleh lebih kecil dari stokPengaman`
      );
    }
  });

  await settingsRepository.upsertReorderSettings(items);
  const rows = await settingsRepository.findReorderSettings({
    search: null,
    kategori: null,
    skus,
    limit: skus.length,
    offset: 0,
  });
  return rows.map(mapSetting);
};

module.exports = {
  getReorderSettings,
  updateReorderSettings,
};
