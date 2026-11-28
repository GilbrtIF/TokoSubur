const { InvariantError } = require('../exceptions');
const {
  ensureObject,
  parseText,
  parseSku,
  parseNumber,
  parseDate,
  parseDateRange,
  parsePagination,
  parseArray,
} = require('./common');

const MAX_NOTA_ITEMS = 100;
const MAX_IMPORT_ROWS = 5000;

const validateTransactionListQuery = (query = {}) => ({
  ...parseDateRange(query),
  kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
  search: parseText(query.search, 'search', { maxLength: 60 }),
  sku: parseSku(query.sku, 'sku', { required: false }),
  ...parsePagination(query),
});

const validateTransactionIdParam = (params = {}) =>
  parseText(params.id, 'id', { required: true, maxLength: 60 });

const validateCreateTransactionPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const items = parseArray(body.items, 'items', {
    min: 1,
    max: MAX_NOTA_ITEMS,
  });

  return {
    tanggal: parseDate(body.tanggal, 'tanggal'),
    kanal: parseText(body.kanal, 'kanal', { maxLength: 30 }),
    noNota: parseText(body.noNota, 'noNota', { maxLength: 60 }),
    items: items.map((item, index) => {
      const label = `items[${index}]`;
      ensureObject(item, label);
      return {
        sku: parseSku(item.sku, `${label}.sku`),
        qty: parseNumber(item.qty, `${label}.qty`, {
          required: true,
          integer: true,
          min: 1,
          max: 100000,
        }),
        hargaSatuan: parseNumber(item.hargaSatuan, `${label}.hargaSatuan`, {
          min: 0,
        }),
        diskonRp: parseNumber(item.diskonRp, `${label}.diskonRp`, { min: 0 }),
      };
    }),
  };
};

const validateSalesImportCommitPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const fileName = parseText(body.fileName, 'fileName', {
    required: true,
    maxLength: 200,
  });
  const validRows = Array.isArray(body.validRows) ? body.validRows : [];
  const rejectedRows = Array.isArray(body.rejectedRows)
    ? body.rejectedRows
    : [];
  const duplicateCount =
    parseNumber(body.duplicateCount, 'duplicateCount', {
      integer: true,
      min: 0,
    }) || 0;

  if (validRows.length === 0 && rejectedRows.length === 0) {
    throw new InvariantError('Tidak ada baris data import untuk diproses');
  }
  if (validRows.length + rejectedRows.length > MAX_IMPORT_ROWS) {
    throw new InvariantError(
      `Maksimal ${MAX_IMPORT_ROWS} baris dalam satu kali import`
    );
  }

  const rowNumberOf = (raw, index) => {
    const value = Number(raw.rowNumber);
    return Number.isInteger(value) && value > 0 ? value : index + 2;
  };

  return {
    fileName,
    duplicateCount,
    validRows: validRows.map((raw, index) => {
      ensureObject(raw, `validRows[${index}]`);
      return {
        rowNumber: rowNumberOf(raw, index),
        tanggal: raw.tanggal,
        kanal: raw.kanal,
        noPesanan: raw.noPesanan,
        sku: raw.sku,
        qty: raw.qty,
        hargaSatuan: raw.hargaSatuan,
        diskonRp: raw.diskonRp,
      };
    }),
    rejectedRows: rejectedRows.map((raw, index) => {
      ensureObject(raw, `rejectedRows[${index}]`);
      return {
        rowNumber: rowNumberOf(raw, index),
        rawText:
          parseText(
            String(raw.rawText || '-'),
            `rejectedRows[${index}].rawText`,
            { maxLength: 1000 }
          ) || '-',
        reason:
          parseText(
            String(raw.reason || 'Baris tidak valid'),
            `rejectedRows[${index}].reason`,
            { maxLength: 1000 }
          ) || 'Baris tidak valid',
      };
    }),
  };
};

module.exports = {
  validateTransactionListQuery,
  validateTransactionIdParam,
  validateCreateTransactionPayload,
  validateSalesImportCommitPayload,
};
