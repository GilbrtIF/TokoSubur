const { InvariantError } = require('../exceptions');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DEFAULT_OFFSET = 0;
const MAX_SEARCH_LENGTH = 100;
const MAX_SKU_LENGTH = 30;
const MAX_NOTE_LENGTH = 200;
const MAX_REF_LENGTH = 80;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED_STATUS_FILTERS = [
  'all',
  'aman',
  'waspada',
  'kritis',
  'selisih_opname',
];
const ALLOWED_OPNAME_LEVELS = ['sku', 'induk'];
const ALLOWED_ALASAN_SELISIH = [
  'Lengkap',
  'Rusak',
  'Belum dicatat',
  'Pecah/susut',
  'Lainnya',
];

const MOVEMENT_TYPE_ALIASES = {
  restok: 'RESTOCK_IN',
  restock_in: 'RESTOCK_IN',
  retur: 'RETURN_IN',
  return_in: 'RETURN_IN',
  rusak: 'DAMAGED_OUT',
  damaged_out: 'DAMAGED_OUT',
  repack: 'SPLIT',
  split: 'SPLIT',
  rakit: 'ASSEMBLE',
  assemble: 'ASSEMBLE',
};

const ensureSingleString = (value, fieldName) => {
  if (Array.isArray(value)) {
    throw new InvariantError(
      `${fieldName} harus berupa teks tunggal, tidak boleh berulang atau array`
    );
  }

  if (typeof value !== 'string') {
    throw new InvariantError(`${fieldName} harus berupa teks`);
  }
};

const parseIsSellable = (raw) => {
  if (raw === undefined) {
    return null;
  }

  ensureSingleString(raw, 'isSellable');

  const normalized = raw.trim().toLowerCase();
  if (normalized === '') {
    return null;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new InvariantError('isSellable harus bernilai true atau false');
};

const parseStatusFilter = (raw) => {
  if (raw === undefined) {
    return 'all';
  }

  ensureSingleString(raw, 'status');

  const normalized = raw.trim().toLowerCase();
  if (normalized === '') {
    return 'all';
  }

  if (!ALLOWED_STATUS_FILTERS.includes(normalized)) {
    throw new InvariantError(
      `status harus salah satu dari: ${ALLOWED_STATUS_FILTERS.join(', ')}`
    );
  }

  return normalized;
};

const parseIntegerInRange = (
  raw,
  fieldName,
  { defaultValue, min, max, errorMessage }
) => {
  if (raw === undefined) {
    return defaultValue;
  }

  ensureSingleString(raw, fieldName);

  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new InvariantError(errorMessage);
  }

  const parsed = Number(trimmed);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < min ||
    (max !== undefined && parsed > max)
  ) {
    throw new InvariantError(errorMessage);
  }

  return parsed;
};

const parsePositiveNumber = (raw, fieldName) => {
  if (raw === undefined || raw === null || raw === '') {
    throw new InvariantError(`${fieldName} wajib diisi`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvariantError(`${fieldName} harus berupa angka lebih dari 0`);
  }

  return parsed;
};

const parseNonNegativeNumber = (raw, fieldName) => {
  if (raw === undefined || raw === null || raw === '') {
    throw new InvariantError(`${fieldName} wajib diisi`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new InvariantError(`${fieldName} harus berupa angka minimal 0`);
  }

  return parsed;
};

const parseSearch = (raw) => {
  if (raw === undefined) {
    return null;
  }

  ensureSingleString(raw, 'search');

  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }

  if (trimmed.length > MAX_SEARCH_LENGTH) {
    throw new InvariantError(`search maksimal ${MAX_SEARCH_LENGTH} karakter`);
  }

  return trimmed;
};

const validateSkuParam = (rawSku, fieldName = 'sku') => {
  ensureSingleString(rawSku, fieldName);

  const trimmed = rawSku.trim();
  if (trimmed === '' || trimmed.length > MAX_SKU_LENGTH) {
    throw new InvariantError(
      `${fieldName} wajib diisi dan maksimal ${MAX_SKU_LENGTH} karakter`
    );
  }

  return trimmed;
};

const parseDateString = (raw, fieldName = 'tanggal') => {
  if (raw === undefined || raw === null || raw === '') {
    return new Date().toISOString().slice(0, 10);
  }

  ensureSingleString(raw, fieldName);
  const trimmed = raw.trim();

  if (!DATE_PATTERN.test(trimmed)) {
    throw new InvariantError(`${fieldName} harus berformat YYYY-MM-DD`);
  }

  const parsedDate = new Date(`${trimmed}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== trimmed
  ) {
    throw new InvariantError(`${fieldName} tidak valid`);
  }

  return trimmed;
};

const parseOptionalText = (raw, fieldName, maxLength) => {
  if (raw === undefined || raw === null) {
    return null;
  }

  ensureSingleString(raw, fieldName);
  const trimmed = raw.trim();

  if (trimmed === '') {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new InvariantError(`${fieldName} maksimal ${maxLength} karakter`);
  }

  return trimmed;
};

const validateStockQuery = (query = {}) => {
  const isSellable = parseIsSellable(query.isSellable);
  const status = parseStatusFilter(query.status);
  const search = parseSearch(query.search);
  const limit = parseIntegerInRange(query.limit, 'limit', {
    defaultValue: DEFAULT_LIMIT,
    min: 1,
    max: MAX_LIMIT,
    errorMessage: `limit harus bilangan bulat antara 1 dan ${MAX_LIMIT}`,
  });
  const offset = parseIntegerInRange(query.offset, 'offset', {
    defaultValue: DEFAULT_OFFSET,
    min: 0,
    errorMessage: 'offset harus bilangan bulat minimal 0',
  });

  return {
    isSellable,
    status,
    search,
    limit,
    offset,
  };
};

const validateStockMovementsRequest = (params = {}, query = {}) => {
  const sku = validateSkuParam(params.sku);
  const limit = parseIntegerInRange(query.limit, 'limit', {
    defaultValue: DEFAULT_LIMIT,
    min: 1,
    max: MAX_LIMIT,
    errorMessage: `limit harus bilangan bulat antara 1 dan ${MAX_LIMIT}`,
  });
  const offset = parseIntegerInRange(query.offset, 'offset', {
    defaultValue: DEFAULT_OFFSET,
    min: 0,
    errorMessage: 'offset harus bilangan bulat minimal 0',
  });

  return {
    sku,
    limit,
    offset,
  };
};

const validateBatchMovementsPayload = (body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InvariantError('Payload harus berupa objek JSON');
  }

  const tanggal = parseDateString(body.tanggal, 'tanggal');

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new InvariantError(
      'items wajib berupa array minimal 1 baris mutasi stok'
    );
  }

  if (body.items.length > 100) {
    throw new InvariantError(
      'Maksimal 100 baris mutasi dalam satu kali penyimpanan'
    );
  }

  const items = body.items.map((rawItem, index) => {
    const label = `items[${index}]`;
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      throw new InvariantError(`${label} harus berupa objek`);
    }

    const sku = validateSkuParam(rawItem.sku, `${label}.sku`);

    if (typeof rawItem.jenis !== 'string' || rawItem.jenis.trim() === '') {
      throw new InvariantError(`${label}.jenis wajib diisi`);
    }

    const normalizedJenis =
      MOVEMENT_TYPE_ALIASES[rawItem.jenis.trim().toLowerCase()];
    if (!normalizedJenis) {
      throw new InvariantError(
        `${label}.jenis tidak valid. Gunakan: restok, retur, rusak, repack, atau rakit`
      );
    }

    const catatan = parseOptionalText(
      rawItem.catatan,
      `${label}.catatan`,
      MAX_NOTE_LENGTH
    );
    const ref = parseOptionalText(rawItem.ref, `${label}.ref`, MAX_REF_LENGTH);

    if (normalizedJenis === 'SPLIT') {
      if (
        Array.isArray(rawItem.repackItems) &&
        rawItem.repackItems.length > 0
      ) {
        const repackItems = rawItem.repackItems.map((sub, subIdx) => {
          const subLabel = `${label}.repackItems[${subIdx}]`;
          if (!sub || typeof sub !== 'object' || Array.isArray(sub)) {
            throw new InvariantError(`${subLabel} harus berupa objek`);
          }

          return {
            skuKemasan: validateSkuParam(
              sub.skuKemasan,
              `${subLabel}.skuKemasan`
            ),
            qtyKemasan: parsePositiveNumber(
              sub.qtyKemasan,
              `${subLabel}.qtyKemasan`
            ),
          };
        });

        return {
          sku,
          jenis: normalizedJenis,
          qty: null,
          repackItems,
          catatan,
          ref,
        };
      }

      const qty = parsePositiveNumber(rawItem.qty, `${label}.qty`);
      return {
        sku,
        jenis: normalizedJenis,
        qty,
        repackItems: [],
        catatan,
        ref,
      };
    }

    const qty = parsePositiveNumber(rawItem.qty, `${label}.qty`);
    return {
      sku,
      jenis: normalizedJenis,
      qty,
      repackItems: [],
      catatan,
      ref,
    };
  });

  return {
    tanggal,
    items,
  };
};

const validateOpnameSheetQuery = (query = {}) => {
  let level = 'sku';
  if (query.level !== undefined) {
    ensureSingleString(query.level, 'level');
    const normalized = query.level.trim().toLowerCase();
    if (normalized !== '') {
      if (!ALLOWED_OPNAME_LEVELS.includes(normalized)) {
        throw new InvariantError('level harus bernilai sku atau induk');
      }
      level = normalized;
    }
  }

  const search = parseSearch(query.search);

  return {
    level,
    search,
  };
};

const validateOpnameHistoryQuery = (query = {}) => {
  const sku =
    query.sku !== undefined ? validateSkuParam(query.sku, 'sku') : null;
  const tanggal =
    query.tanggal !== undefined
      ? parseDateString(query.tanggal, 'tanggal')
      : null;
  const limit = parseIntegerInRange(query.limit, 'limit', {
    defaultValue: DEFAULT_LIMIT,
    min: 1,
    max: MAX_LIMIT,
    errorMessage: `limit harus bilangan bulat antara 1 dan ${MAX_LIMIT}`,
  });
  const offset = parseIntegerInRange(query.offset, 'offset', {
    defaultValue: DEFAULT_OFFSET,
    min: 0,
    errorMessage: 'offset harus bilangan bulat minimal 0',
  });

  return {
    sku,
    tanggal,
    limit,
    offset,
  };
};

const validateOpnamePayload = (body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InvariantError('Payload harus berupa objek JSON');
  }

  const tanggal = parseDateString(body.tanggal, 'tanggal');

  let level = 'sku';
  if (body.level !== undefined) {
    ensureSingleString(body.level, 'level');
    const normalized = body.level.trim().toLowerCase();
    if (!ALLOWED_OPNAME_LEVELS.includes(normalized)) {
      throw new InvariantError('level harus bernilai sku atau induk');
    }
    level = normalized;
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new InvariantError(
      'items wajib berupa array minimal 1 item hasil opname'
    );
  }

  if (body.items.length > 250) {
    throw new InvariantError('Maksimal 250 item dalam satu sesi opname');
  }

  const seenSkus = new Set();
  const items = body.items.map((rawItem, index) => {
    const label = `items[${index}]`;
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      throw new InvariantError(`${label} harus berupa objek`);
    }

    const sku = validateSkuParam(rawItem.sku, `${label}.sku`);
    if (seenSkus.has(sku)) {
      throw new InvariantError(`Duplikat SKU ${sku} pada daftar opname`);
    }
    seenSkus.add(sku);

    const stokFisik = parseNonNegativeNumber(
      rawItem.stokFisik,
      `${label}.stokFisik`
    );

    let alasanSelisih = null;
    if (rawItem.alasanSelisih !== undefined && rawItem.alasanSelisih !== null) {
      ensureSingleString(rawItem.alasanSelisih, `${label}.alasanSelisih`);
      const trimmedAlasan = rawItem.alasanSelisih.trim();
      if (trimmedAlasan !== '') {
        if (!ALLOWED_ALASAN_SELISIH.includes(trimmedAlasan)) {
          throw new InvariantError(
            `${label}.alasanSelisih harus salah satu dari: ${ALLOWED_ALASAN_SELISIH.join(', ')}`
          );
        }
        alasanSelisih = trimmedAlasan;
      }
    }

    const catatan = parseOptionalText(
      rawItem.catatan,
      `${label}.catatan`,
      MAX_NOTE_LENGTH
    );

    return {
      sku,
      stokFisik,
      alasanSelisih,
      catatan,
    };
  });

  return {
    tanggal,
    level,
    items,
  };
};

const IMPORT_MOVEMENT_ALIASES = {
  restok: 'RESTOCK_IN',
  restock_in: 'RESTOCK_IN',
  retur: 'RETURN_IN',
  return_in: 'RETURN_IN',
  rusak: 'DAMAGED_OUT',
  damaged_out: 'DAMAGED_OUT',
  penyesuaian: 'ADJUSTMENT',
  adjustment: 'ADJUSTMENT',
};

const validateStockImportCommitPayload = (body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InvariantError('Payload harus berupa objek JSON');
  }

  const fileName = parseOptionalText(body.fileName, 'fileName', 200);
  if (!fileName) {
    throw new InvariantError('fileName wajib diisi');
  }

  const validRows = Array.isArray(body.validRows) ? body.validRows : [];
  const rejectedRows = Array.isArray(body.rejectedRows)
    ? body.rejectedRows
    : [];
  const duplicateCount =
    body.duplicateCount !== undefined && body.duplicateCount !== null
      ? Number(body.duplicateCount)
      : 0;

  if (!Number.isInteger(duplicateCount) || duplicateCount < 0) {
    throw new InvariantError('duplicateCount harus bilangan bulat minimal 0');
  }

  if (
    validRows.length === 0 &&
    rejectedRows.length === 0 &&
    duplicateCount === 0
  ) {
    throw new InvariantError('Tidak ada baris data import untuk diproses');
  }

  const sanitizedValidRows = validRows.map((raw, index) => {
    const label = `validRows[${index}]`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new InvariantError(`${label} harus berupa objek`);
    }

    const tanggal = parseDateString(raw.tanggal, `${label}.tanggal`);
    const sku = validateSkuParam(raw.sku, `${label}.sku`);

    if (typeof raw.jenis !== 'string' || raw.jenis.trim() === '') {
      throw new InvariantError(`${label}.jenis wajib diisi`);
    }

    const normalizedJenis =
      IMPORT_MOVEMENT_ALIASES[raw.jenis.trim().toLowerCase()];
    if (!normalizedJenis) {
      throw new InvariantError(`${label}.jenis tidak valid untuk import stok`);
    }

    const qty = Number(raw.qty);
    if (!Number.isFinite(qty) || qty === 0) {
      throw new InvariantError(`${label}.qty tidak valid`);
    }

    if (normalizedJenis === 'DAMAGED_OUT' && qty > 0) {
      throw new InvariantError(
        `${label}.qty untuk DAMAGED_OUT harus bernilai negatif`
      );
    }

    if (
      (normalizedJenis === 'RESTOCK_IN' || normalizedJenis === 'RETURN_IN') &&
      qty <= 0
    ) {
      throw new InvariantError(
        `${label}.qty untuk ${normalizedJenis} harus lebih dari 0`
      );
    }

    const catatan = parseOptionalText(
      raw.catatan,
      `${label}.catatan`,
      MAX_NOTE_LENGTH
    );
    const rowNumber =
      raw.rowNumber !== undefined && raw.rowNumber !== null
        ? Number(raw.rowNumber)
        : index + 2;

    return {
      rowNumber:
        Number.isInteger(rowNumber) && rowNumber > 0 ? rowNumber : index + 2,
      tanggal,
      sku,
      jenis: normalizedJenis,
      qty,
      catatan,
    };
  });

  const sanitizedRejectedRows = rejectedRows.map((raw, index) => {
    const label = `rejectedRows[${index}]`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new InvariantError(`${label} harus berupa objek`);
    }

    const rowNumber =
      raw.rowNumber !== undefined && raw.rowNumber !== null
        ? Number(raw.rowNumber)
        : index + 2;
    const rawText =
      parseOptionalText(raw.rawText, `${label}.rawText`, 500) || '-';
    const reason =
      parseOptionalText(raw.reason, `${label}.reason`, 300) ||
      'Baris tidak valid';

    return {
      rowNumber:
        Number.isInteger(rowNumber) && rowNumber > 0 ? rowNumber : index + 2,
      rawText,
      reason,
    };
  });

  return {
    fileName,
    duplicateCount,
    validRows: sanitizedValidRows,
    rejectedRows: sanitizedRejectedRows,
  };
};

module.exports = {
  validateStockQuery,
  validateStockMovementsRequest,
  validateSkuParam,
  validateBatchMovementsPayload,
  validateOpnameSheetQuery,
  validateOpnameHistoryQuery,
  validateOpnamePayload,
  validateStockImportCommitPayload,
};
