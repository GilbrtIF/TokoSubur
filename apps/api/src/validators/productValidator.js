const { InvariantError } = require('../exceptions');
const {
  ensureObject,
  parseText,
  parseSku,
  parseNewSku,
  parseNumber,
  parseBoolean,
  parseEnum,
  parsePagination,
  parseArray,
} = require('./common');

const MAX_COMPONENTS = 30;

/**
 * Mengurai satu field opsional.
 * - tidak dikirim  -> undefined (tidak diubah)
 * - null / ''      -> null (dikosongkan), kecuali field wajib
 */
const optional = (body, key, parser) => {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return undefined;
  }
  const value = body[key];
  if (value === null || value === '') {
    return null;
  }
  return parser(value);
};

const money = (key) => (value) => parseNumber(value, key, { min: 0 });

const parseComponents = (raw) => {
  const list = parseArray(raw, 'komponen', { min: 1, max: MAX_COMPONENTS });
  const seen = new Set();

  return list.map((item, index) => {
    const label = `komponen[${index}]`;
    ensureObject(item, label);
    const skuKomponen = parseSku(item.skuKomponen, `${label}.skuKomponen`);
    if (seen.has(skuKomponen)) {
      throw new InvariantError(
        `Komponen ${skuKomponen} ditulis lebih dari sekali`
      );
    }
    seen.add(skuKomponen);
    return {
      skuKomponen,
      qty: parseNumber(item.qty, `${label}.qty`, {
        required: true,
        min: 0.01,
        max: 100000,
      }),
    };
  });
};

const parseFields = (body) => ({
  nama: optional(body, 'nama', (v) =>
    parseText(v, 'nama', { required: true, maxLength: 150 })
  ),
  kategori: optional(body, 'kategori', (v) =>
    parseText(v, 'kategori', { maxLength: 60 })
  ),
  satuanStok: optional(body, 'satuanStok', (v) =>
    parseText(v, 'satuanStok', { required: true, maxLength: 10 })
  ),
  isSellable: optional(body, 'isSellable', (v) =>
    parseBoolean(v, 'isSellable', { required: true })
  ),
  isBundle: optional(body, 'isBundle', (v) =>
    parseBoolean(v, 'isBundle', { required: true })
  ),
  isIndukPemecahan: optional(body, 'isIndukPemecahan', (v) =>
    parseBoolean(v, 'isIndukPemecahan', { required: true })
  ),
  isActive: optional(body, 'isActive', (v) =>
    parseBoolean(v, 'isActive', { required: true })
  ),
  skuInduk: optional(body, 'skuInduk', (v) => parseSku(v, 'skuInduk')),
  faktorKeInduk: optional(body, 'faktorKeInduk', (v) =>
    parseNumber(v, 'faktorKeInduk', { min: 0.0001, max: 100000 })
  ),
  isiPerPembelian: optional(body, 'isiPerPembelian', (v) =>
    parseNumber(v, 'isiPerPembelian', { min: 0.01, max: 1000000 })
  ),
  satuanBeli: optional(body, 'satuanBeli', (v) =>
    parseText(v, 'satuanBeli', { maxLength: 60 })
  ),
  hargaKulakan: optional(body, 'hargaKulakan', money('hargaKulakan')),
  hpp: optional(body, 'hpp', money('hpp')),
  hargaJualOnline: optional(body, 'hargaJualOnline', money('hargaJualOnline')),
  hargaJualOffline: optional(
    body,
    'hargaJualOffline',
    money('hargaJualOffline')
  ),
  supplierUtama: optional(body, 'supplierUtama', (v) =>
    parseText(v, 'supplierUtama', { maxLength: 10 })
  ),
});

const validateCreateProductPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const sku = parseNewSku(body.sku, 'sku');
  const fields = parseFields(body);

  if (!fields.nama) {
    throw new InvariantError('nama wajib diisi');
  }
  if (!fields.satuanStok) {
    throw new InvariantError('satuanStok wajib diisi');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    throw new InvariantError('isActive tidak dapat diisi saat membuat produk');
  }

  const withDefault = (value, fallback) =>
    value === undefined || value === null ? fallback : value;
  fields.isSellable = withDefault(fields.isSellable, true);
  fields.isBundle = withDefault(fields.isBundle, false);
  fields.isIndukPemecahan = withDefault(fields.isIndukPemecahan, false);

  const components =
    body.komponen === undefined || body.komponen === null
      ? []
      : parseComponents(body.komponen);

  return { sku, fields, components };
};

const validateUpdateProductPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  if (Object.prototype.hasOwnProperty.call(body, 'sku')) {
    throw new InvariantError('sku tidak dapat diubah');
  }

  const fields = parseFields(body);
  const components =
    body.komponen === undefined ? undefined : parseComponents(body.komponen);

  const hasChanges =
    Object.values(fields).some((value) => value !== undefined) ||
    components !== undefined;
  if (!hasChanges) {
    throw new InvariantError('Tidak ada data produk yang diubah');
  }

  return { fields, components };
};

const validateProductListQuery = (query = {}) => ({
  search: parseText(query.search, 'search', { maxLength: 100 }),
  kategori: parseText(query.kategori, 'kategori', { maxLength: 60 }),
  status: parseEnum(query.status, 'status', ['active', 'inactive', 'all'], {
    defaultValue: 'active',
  }),
  isSellable: parseBoolean(query.isSellable, 'isSellable'),
  isBundle: parseBoolean(query.isBundle, 'isBundle'),
  ...parsePagination(query),
});

const validateSkuParam = (params = {}) => parseSku(params.sku, 'sku');

module.exports = {
  validateCreateProductPayload,
  validateUpdateProductPayload,
  validateProductListQuery,
  validateSkuParam,
};
