const stockRepository = require('../repositories/stockRepository');

const toNullableNumber = (value) =>
  value === null || value === undefined ? null : Number(value);

const mapStockRow = (row) => ({
  sku: row.sku,
  productId: Number(row.product_id),
  nama: row.nama,
  kategori: row.kategori === undefined ? null : row.kategori,
  isSellable: Boolean(row.is_sellable),
  isBundle: Boolean(row.is_bundle),
  isIndukPemecahan: Boolean(row.is_induk_pemecahan),
  satuanStok: row.satuan_stok,
  skuInduk: row.sku_induk === undefined ? null : row.sku_induk,
  namaInduk: row.nama_induk === undefined ? null : row.nama_induk,
  faktorKeInduk: toNullableNumber(row.faktor_ke_induk),
  currentStock: Number(row.stok),
});

const getStocks = async ({ isSellable, search, limit, offset }) => {
  const [rows, total] = await Promise.all([
    stockRepository.findStocks({ isSellable, search, limit, offset }),
    stockRepository.countStocks({ isSellable, search }),
  ]);

  return {
    data: rows.map(mapStockRow),
    meta: {
      limit,
      offset,
      total,
    },
  };
};

module.exports = {
  getStocks,
};
