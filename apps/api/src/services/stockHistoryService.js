const stockHistoryRepository = require('../repositories/stockHistoryRepository');
const { toNumberOrNull } = require('../utils/format');

const EVENT_LABELS = {
  opname: 'Stok Opname',
  import: 'Import File Stok',
  manual: 'Catat Stok Manual',
};

const mapOpnameItem = (row) => ({
  sku: row.sku,
  nama: row.nama,
  satuanStok: row.satuan_stok,
  jenis: 'OPNAME',
  qty: toNumberOrNull(row.selisih),
  stokSistem: toNumberOrNull(row.stok_sistem),
  stokFisik: toNumberOrNull(row.stok_fisik),
  selisih: toNumberOrNull(row.selisih),
  alasan: row.alasan_selisih || null,
  catatan: row.catatan || null,
});

const mapMovementItem = (row) => ({
  sku: row.sku,
  nama: row.nama,
  satuanStok: row.satuan_stok,
  tanggal: row.tanggal,
  jenis: row.jenis,
  qty: Number(row.qty),
  stokSistem: null,
  stokFisik: null,
  selisih: null,
  alasan: null,
  catatan: row.sumber || null,
});

const loadItems = async (event) => {
  if (event.tipe === 'opname') {
    return (
      await stockHistoryRepository.findOpnameItems(event.tanggal, event.kunci)
    ).map(mapOpnameItem);
  }
  if (event.tipe === 'import') {
    return (
      await stockHistoryRepository.findMovementItems({
        batchId: event.batch_id,
      })
    ).map(mapMovementItem);
  }
  return (
    await stockHistoryRepository.findMovementItems({ manualKey: event.kunci })
  ).map(mapMovementItem);
};

const getStockHistory = async (filter) => {
  const [events, total] = await Promise.all([
    stockHistoryRepository.findEvents(filter),
    stockHistoryRepository.countEvents(filter),
  ]);

  const data = await Promise.all(
    events.map(async (event) => ({
      id: `${event.tipe}:${event.kunci || event.tanggal}`,
      tipe: event.tipe,
      label: EVENT_LABELS[event.tipe],
      tanggal: event.tanggal,
      waktu: event.waktu,
      jumlahItem: event.jumlah_item,
      jumlahSelisih: event.tipe === 'opname' ? event.jumlah_selisih : null,
      berkas: event.berkas || null,
      batchId: event.batch_id,
      diimporOleh: event.diimpor_oleh || null,
      items: filter.includeItems ? await loadItems(event) : undefined,
    }))
  );

  return { data, meta: { limit: filter.limit, offset: filter.offset, total } };
};

module.exports = {
  getStockHistory,
};
