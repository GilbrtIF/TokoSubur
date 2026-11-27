const productRepository = require('../repositories/productRepository');
const { InvariantError, NotFoundError } = require('../exceptions');
const { toNumberOrNull, toNumber } = require('../utils/format');

const REQUIRED_ON_UPDATE = [
  'nama',
  'satuanStok',
  'isSellable',
  'isBundle',
  'isIndukPemecahan',
  'isActive',
];

const mapProduct = (row) => ({
  sku: row.sku,
  productId: Number(row.product_id),
  nama: row.nama,
  kategori: row.kategori,
  isActive: Boolean(row.is_active),
  isSellable: Boolean(row.is_sellable),
  isBundle: Boolean(row.is_bundle),
  isIndukPemecahan: Boolean(row.is_induk_pemecahan),
  satuanStok: row.satuan_stok,
  skuInduk: row.sku_induk || null,
  namaInduk: row.nama_induk || null,
  faktorKeInduk: toNumberOrNull(row.faktor_ke_induk),
  isiPerPembelian: toNumberOrNull(row.isi_per_pembelian),
  satuanBeli: row.satuan_beli || null,
  hargaKulakan: toNumberOrNull(row.harga_kulakan),
  hpp: toNumberOrNull(row.hpp),
  hargaJualOnline: toNumberOrNull(row.harga_jual_online),
  hargaJualOffline: toNumberOrNull(row.harga_jual_offline),
  supplierUtama: row.supplier_utama || null,
  namaSupplier: row.nama_supplier || null,
  stokSaatIni: toNumber(row.stok_saat_ini),
});

const getProducts = async (filter) => {
  const [rows, total] = await Promise.all([
    productRepository.findProducts(filter),
    productRepository.countProducts(filter),
  ]);
  return {
    data: rows.map(mapProduct),
    meta: { limit: filter.limit, offset: filter.offset, total },
  };
};

const getCategories = async () => {
  const rows = await productRepository.findCategories();
  return rows.map((row) => ({
    kategori: row.kategori,
    jumlahSku: row.jumlah_sku,
  }));
};

const getProductBySku = async (sku) => {
  const row = await productRepository.findBySku(sku);
  if (!row) {
    throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
  }

  const [components, usedInBundles, children, reorder, prices] =
    await Promise.all([
      row.is_bundle ? productRepository.findBundleComponents(sku) : [],
      productRepository.findBundlesUsingComponent(sku),
      row.is_induk_pemecahan ? productRepository.findChildren(sku) : [],
      productRepository.findReorderSetting(sku),
      productRepository.findLatestPrices(sku),
    ]);

  const hargaTerbaru = {};
  prices.forEach((price) => {
    hargaTerbaru[price.jenis_harga] = {
      harga: Number(price.harga),
      bulan: price.bulan,
    };
  });

  return {
    ...mapProduct(row),
    komponen: components.map((comp) => ({
      skuKomponen: comp.sku_komponen,
      namaKomponen: comp.nama_komponen,
      satuanStok: comp.satuan_stok,
      isActive: Boolean(comp.is_active),
      qty: Number(comp.qty_komponen_per_paket),
      stokSaatIni: toNumber(comp.stok_saat_ini),
    })),
    dipakaiDiPaket: usedInBundles.map((bundle) => ({
      skuPaket: bundle.sku_paket,
      namaPaket: bundle.nama_paket,
      isActive: Boolean(bundle.is_active),
    })),
    kemasan: children.map((child) => ({
      sku: child.sku,
      nama: child.nama,
      satuanStok: child.satuan_stok,
      faktorKeInduk: toNumberOrNull(child.faktor_ke_induk),
      isActive: Boolean(child.is_active),
      stokSaatIni: toNumber(child.stok_saat_ini),
    })),
    reorderSetting: reorder
      ? {
          stokMinimumManual: toNumberOrNull(reorder.stok_minimum_manual),
          titikPesanUlang: toNumberOrNull(reorder.titik_pesan_ulang),
          stokPengaman: toNumberOrNull(reorder.stok_pengaman),
          leadTimeHari: reorder.lead_time_hari,
          sumberLeadTime: reorder.sumber_lead_time,
        }
      : null,
    hargaTerbaru,
  };
};

/**
 * Memvalidasi aturan bisnis produk terhadap kondisi akhir (data lama + perubahan).
 * Mengisi kolom turunan (nama_induk, kelompok_induk, base_unit, faktor).
 */
const applyBusinessRules = async ({
  sku,
  state,
  fields,
  components,
  existingComponents,
}) => {
  if (state.isIndukPemecahan && state.skuInduk) {
    throw new InvariantError(
      'Bahan induk pemecahan tidak boleh memiliki skuInduk'
    );
  }
  if (state.isIndukPemecahan && state.isBundle) {
    throw new InvariantError('Bahan induk pemecahan tidak boleh berupa paket');
  }
  if (state.isBundle && state.skuInduk) {
    throw new InvariantError('Produk paket tidak boleh memiliki skuInduk');
  }

  // Produk kemasan hasil pemecahan
  if (state.skuInduk) {
    if (state.skuInduk === sku) {
      throw new InvariantError('skuInduk tidak boleh sama dengan sku produk');
    }
    if (!state.faktorKeInduk || state.faktorKeInduk <= 0) {
      throw new InvariantError(
        'faktorKeInduk wajib diisi (> 0) untuk produk yang memiliki skuInduk'
      );
    }
    if (fields.skuInduk !== undefined) {
      const [induk] = await productRepository.findBySkus([state.skuInduk]);
      if (!induk) {
        throw new NotFoundError(
          `Produk induk ${state.skuInduk} tidak ditemukan`
        );
      }
      if (!induk.is_active) {
        throw new InvariantError(
          `Produk induk ${state.skuInduk} sudah nonaktif`
        );
      }
      if (!induk.is_induk_pemecahan) {
        throw new InvariantError(
          `Produk ${state.skuInduk} bukan bahan induk pemecahan`
        );
      }
      Object.assign(fields, {
        namaInduk: induk.nama,
        kelompokInduk: induk.kelompok_induk,
        baseUnit: induk.satuan_stok ? induk.satuan_stok.slice(0, 5) : null,
      });
    }
    if (fields.faktorKeInduk !== undefined || fields.skuInduk !== undefined) {
      Object.assign(fields, { faktor: state.faktorKeInduk });
    }
  } else if (fields.skuInduk === null) {
    Object.assign(fields, {
      namaInduk: null,
      kelompokInduk: null,
      baseUnit: null,
      faktor: null,
      faktorKeInduk: null,
    });
  }

  // Paket
  const finalComponents =
    components !== undefined ? components : existingComponents;
  if (state.isBundle && (!finalComponents || finalComponents.length === 0)) {
    throw new InvariantError('Produk paket wajib memiliki minimal 1 komponen');
  }
  if (!state.isBundle && components && components.length > 0) {
    throw new InvariantError(
      'komponen hanya boleh diisi untuk produk paket (isBundle = true)'
    );
  }
  if (state.isBundle && components && components.length > 0) {
    const skus = components.map((comp) => comp.skuKomponen);
    if (skus.includes(sku)) {
      throw new InvariantError('Paket tidak boleh berisi dirinya sendiri');
    }
    const found = await productRepository.findBySkus(skus);
    const foundMap = new Map(found.map((p) => [p.sku, p]));
    skus.forEach((compSku) => {
      const comp = foundMap.get(compSku);
      if (!comp) {
        throw new NotFoundError(`Komponen ${compSku} tidak ditemukan`);
      }
      if (!comp.is_active) {
        throw new InvariantError(`Komponen ${compSku} sudah nonaktif`);
      }
      if (comp.is_bundle) {
        throw new InvariantError(
          `Komponen ${compSku} adalah paket; paket bertingkat tidak didukung`
        );
      }
    });
  }

  if (state.supplierUtama && fields.supplierUtama !== undefined) {
    const exists = await productRepository.supplierExists(state.supplierUtama);
    if (!exists) {
      throw new NotFoundError(
        `Supplier ${state.supplierUtama} tidak ditemukan`
      );
    }
  }
};

const createProduct = async ({ sku, fields, components }) => {
  const existing = await productRepository.findBySku(sku);
  if (existing) {
    throw new InvariantError(
      existing.is_active
        ? `SKU ${sku} sudah terdaftar`
        : `SKU ${sku} sudah terdaftar dalam status nonaktif; aktifkan kembali lewat PUT /api/products/${sku}`
    );
  }

  const state = { ...fields };
  await applyBusinessRules({
    sku,
    state,
    fields,
    components,
    existingComponents: [],
  });

  const created = await productRepository.createProduct({
    sku,
    fields: { ...fields, sumberHarga: 'manual' },
    components: state.isBundle ? components : [],
  });
  return mapProduct(created);
};

const updateProduct = async (sku, { fields, components }) => {
  const existing = await productRepository.findBySku(sku);
  if (!existing) {
    throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
  }

  REQUIRED_ON_UPDATE.forEach((key) => {
    if (fields[key] === null) {
      throw new InvariantError(`${key} tidak boleh dikosongkan`);
    }
  });

  const current = mapProduct(existing);
  const state = { ...current };
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      state[key] = value;
    }
  });

  const existingComponents = current.isBundle
    ? await productRepository.findBundleComponents(sku)
    : [];

  if (current.isIndukPemecahan && state.isIndukPemecahan === false) {
    const children = await productRepository.findChildren(sku);
    if (children.length > 0) {
      throw new InvariantError(
        `Produk ${sku} masih menjadi induk dari ${children.length} produk kemasan`
      );
    }
  }

  await applyBusinessRules({
    sku,
    state,
    fields,
    components,
    existingComponents,
  });

  // Paket diubah menjadi non-paket -> hapus komponen lama.
  const nextComponents =
    current.isBundle && state.isBundle === false ? [] : components;

  const updated = await productRepository.updateProduct({
    sku,
    fields,
    components: nextComponents,
  });
  return mapProduct(updated);
};

const deleteProduct = async (sku) => {
  const existing = await productRepository.findBySku(sku);
  if (!existing) {
    throw new NotFoundError(`Produk dengan SKU ${sku} tidak ditemukan`);
  }

  const { mode, usage } = await productRepository.deleteProduct(sku);
  const dipakaiDi = Object.entries(usage)
    .filter(([, count]) => count > 0)
    .map(([tabel, jumlah]) => ({ tabel, jumlah }));

  return {
    sku,
    mode,
    message:
      mode === 'soft'
        ? `Produk ${sku} dinonaktifkan (discontinue) karena sudah memiliki riwayat data`
        : `Produk ${sku} dihapus permanen karena belum pernah dipakai`,
    dipakaiDi,
  };
};

module.exports = {
  getProducts,
  getCategories,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
};
