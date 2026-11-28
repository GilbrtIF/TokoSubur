const {
  ensureObject,
  parseText,
  parseSku,
  parseEnum,
  parseNumber,
  parseDateRange,
  parsePagination,
} = require('./common');

const validateImportBatchQuery = (query = {}) => ({
  jenisImpor: parseText(query.jenisImpor, 'jenisImpor', { maxLength: 20 }),
  status: parseEnum(query.status, 'status', ['berhasil', 'sebagian', 'gagal']),
  ...parsePagination(query),
});

const validateRejectedQuery = (query = {}) => ({
  tahap: parseText(query.tahap, 'tahap', { maxLength: 30 }),
  berkas: parseText(query.berkas, 'berkas', { maxLength: 200 }),
  jenisAlasan: parseText(query.jenisAlasan, 'jenisAlasan', { maxLength: 80 }),
  batchId: parseNumber(query.batchId, 'batchId', { integer: true, min: 1 }),
  ...parsePagination(query),
});

const validateAmbiguousQuery = (query = {}) => ({
  kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
  ...parseDateRange(query),
  ...parsePagination(query),
});

const validateMappingQuery = (query = {}) => ({
  status: parseEnum(query.status, 'status', [
    'masuk',
    'ditolak',
    'sebagian ditolak',
  ]),
  sumber: parseText(query.sumber, 'sumber', { maxLength: 30 }),
  search: parseText(query.search, 'search', { maxLength: 100 }),
  ...parsePagination(query),
});

const validateMappingPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  return {
    sumber: parseText(body.sumber, 'sumber', { required: true, maxLength: 30 }),
    teks: parseText(body.teks, 'teks', { required: true, maxLength: 200 }),
    skuHasil: parseSku(body.skuHasil, 'skuHasil'),
    aturan: parseText(body.aturan, 'aturan', { maxLength: 120 }),
  };
};

module.exports = {
  validateImportBatchQuery,
  validateRejectedQuery,
  validateAmbiguousQuery,
  validateMappingQuery,
  validateMappingPayload,
};
