const { InvariantError } = require('../exceptions');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DEFAULT_OFFSET = 0;
const MAX_SEARCH_LENGTH = 100;

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

const validateStockQuery = (query = {}) => {
  const isSellable = parseIsSellable(query.isSellable);
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
    search,
    limit,
    offset,
  };
};

module.exports = {
  validateStockQuery,
};
