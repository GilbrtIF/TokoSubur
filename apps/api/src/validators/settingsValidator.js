const { InvariantError } = require('../exceptions');
const {
  ensureObject,
  parseText,
  parseSku,
  parseNumber,
  parsePagination,
  parseArray,
} = require('./common');

const FIELDS = {
  stokMinimumManual: { min: 0, max: 1000000 },
  titikPesanUlang: { min: 0, max: 1000000 },
  stokPengaman: { min: 0, max: 1000000 },
  leadTimeHari: { min: 0, max: 365, integer: true },
};
// Kolom yang boleh dikosongkan (null). Kolom lain wajib angka bila dikirim.
const NULLABLE = ['stokMinimumManual'];

const parseSettingItem = (raw, label, skuOverride) => {
  const body = ensureObject(raw, label);
  const item = { sku: skuOverride || parseSku(body.sku, `${label}.sku`) };
  let changed = 0;

  Object.entries(FIELDS).forEach(([key, rule]) => {
    if (!Object.prototype.hasOwnProperty.call(body, key)) {
      return;
    }
    changed += 1;
    if (body[key] === null || body[key] === '') {
      if (!NULLABLE.includes(key)) {
        throw new InvariantError(`${label}.${key} tidak boleh dikosongkan`);
      }
      item[key] = null;
      return;
    }
    item[key] = parseNumber(body[key], `${label}.${key}`, {
      required: true,
      ...rule,
    });
  });

  if (changed === 0) {
    throw new InvariantError(
      `${label} minimal berisi salah satu: ${Object.keys(FIELDS).join(', ')}`
    );
  }
  return item;
};

const validateReorderListQuery = (query = {}) => ({
  search: parseText(query.search, 'search', { maxLength: 100 }),
  kategori: parseText(query.kategori, 'kategori', { maxLength: 60 }),
  ...parsePagination(query),
});

const validateSingleReorderPayload = (params, body) => [
  parseSettingItem(body, 'payload', parseSku(params.sku, 'sku')),
];

const validateBulkReorderPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const items = parseArray(body.items, 'items', { min: 1, max: 200 });
  const seen = new Set();
  return items.map((raw, index) => {
    const item = parseSettingItem(raw, `items[${index}]`);
    if (seen.has(item.sku)) {
      throw new InvariantError(`SKU ${item.sku} ditulis lebih dari sekali`);
    }
    seen.add(item.sku);
    return item;
  });
};

module.exports = {
  validateReorderListQuery,
  validateSingleReorderPayload,
  validateBulkReorderPayload,
};
