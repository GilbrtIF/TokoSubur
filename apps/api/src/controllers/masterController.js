const masterRepository = require('../repositories/masterRepository');
const { isOnlineChannel } = require('../utils/channel');

const getSuppliers = async (req, res, next) => {
  try {
    const rows = await masterRepository.findSuppliers();
    return res.status(200).json({
      status: 'success',
      data: rows.map((row) => ({
        supplierCode: row.supplier_code,
        namaSupplier: row.nama_supplier,
        kelompokProduk: row.kelompok_produk,
        leadTimeHari: row.lead_time_hari,
        jumlahProdukAktif: row.jumlah_produk_aktif,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const getChannels = async (req, res, next) => {
  try {
    const rows = await masterRepository.findChannels();
    return res.status(200).json({
      status: 'success',
      data: rows.map((row) => ({
        channelId: row.channel_id,
        kanal: row.kanal,
        kode: row.kode,
        jenis: row.jenis,
        isOnline: isOnlineChannel(row),
        dasarPendapatan: row.dasar_pendapatan,
        frekuensiData: row.frekuensi_data,
        dataCompleteUntil: row.data_complete_until || null,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSuppliers,
  getChannels,
};
