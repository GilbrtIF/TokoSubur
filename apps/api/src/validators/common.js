/**
 * Helper validasi yang dipakai bersama oleh validator modul baru.
 * Semua fungsi melempar InvariantError (HTTP 400) dengan pesan berbahasa Indonesia.
 */
const { InvariantError } = require('../exceptions');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]*$/;
const MAX_SKU_LENGTH = 30;

const isMissing = (value) =>
  value === undefined || value === null || value === '';

const ensureObject = (body, label = 'Payload') => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InvariantError(`${label} harus berupa objek JSON`);
  }
  return body;
};

/** Query string tidak boleh dikirim berulang (?a=1&a=2). */
const ensureSingleQueryValue = (value, fieldName) => {
  if (Array.isArray(value)) {
    throw new InvariantError(
      `${fieldName} harus berupa teks tunggal, tidak boleh berulang atau array`
    );
  }
  return value;
};

const parseText = (
  raw,
  fieldName,
  { required = false, maxLength = 200, minLength = 0 } = {}
) => {
  ensureSingleQueryValue(raw, fieldName);
  if (raw === undefined || raw === null) {
    if (required) {
      throw new InvariantError(`${fieldName} wajib diisi`);
    }
    return null;
  }
  if (typeof raw !== 'string') {
    throw new InvariantError(`${fieldName} harus berupa teks`);
  }
  const trimmed = raw.trim();
  if (trimmed === '') {
    if (required) {
      throw new InvariantError(`${fieldName} wajib diisi`);
    }
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new InvariantError(`${fieldName} maksimal ${maxLength} karakter`);
  }
  if (trimmed.length < minLength) {
    throw new InvariantError(`${fieldName} minimal ${minLength} karakter`);
  }
  return trimmed;
};

const parseSku = (raw, fieldName = 'sku', { required = true } = {}) => {
  const text = parseText(raw, fieldName, {
    required,
    maxLength: MAX_SKU_LENGTH,
  });
  return text === null ? null : text.toUpperCase();
};

/** SKU baru wajib huruf besar/angka/titik/strip/garis bawah. */
const parseNewSku = (raw, fieldName = 'sku') => {
  const sku = parseSku(raw, fieldName);
  if (!SKU_PATTERN.test(sku)) {
    throw new InvariantError(
      `${fieldName} hanya boleh berisi huruf, angka, titik, strip, atau garis bawah`
    );
  }
  return sku;
};

const parseNumber = (
  raw,
  fieldName,
  { required = false, min, max, integer = false, allowZero = true } = {}
) => {
  ensureSingleQueryValue(raw, fieldName);
  if (isMissing(raw)) {
    if (required) {
      throw new InvariantError(`${fieldName} wajib diisi`);
    }
    return null;
  }
  if (typeof raw === 'boolean' || (typeof raw === 'string' && !raw.trim())) {
    throw new InvariantError(`${fieldName} harus berupa angka`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new InvariantError(`${fieldName} harus berupa angka`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new InvariantError(`${fieldName} harus bilangan bulat`);
  }
  if (!allowZero && value === 0) {
    throw new InvariantError(`${fieldName} tidak boleh 0`);
  }
  if (min !== undefined && value < min) {
    throw new InvariantError(`${fieldName} minimal ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new InvariantError(`${fieldName} maksimal ${max}`);
  }
  return value;
};

const parseBoolean = (raw, fieldName, { required = false } = {}) => {
  ensureSingleQueryValue(raw, fieldName);
  if (isMissing(raw)) {
    if (required) {
      throw new InvariantError(`${fieldName} wajib diisi`);
    }
    return null;
  }
  if (typeof raw === 'boolean') {
    return raw;
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  throw new InvariantError(`${fieldName} harus bernilai true atau false`);
};

const parseEnum = (raw, fieldName, allowed, { defaultValue = null } = {}) => {
  const text = parseText(raw, fieldName, { maxLength: 50 });
  if (text === null) {
    return defaultValue;
  }
  const match = allowed.find(
    (option) => option.toLowerCase() === text.toLowerCase()
  );
  if (!match) {
    throw new InvariantError(
      `${fieldName} harus salah satu dari: ${allowed.join(', ')}`
    );
  }
  return match;
};

const parseDate = (raw, fieldName, { required = false } = {}) => {
  const text = parseText(raw, fieldName, { required, maxLength: 10 });
  if (text === null) {
    return null;
  }
  if (!DATE_PATTERN.test(text)) {
    throw new InvariantError(`${fieldName} harus berformat YYYY-MM-DD`);
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== text
  ) {
    throw new InvariantError(`${fieldName} tidak valid`);
  }
  return text;
};

const parseDateRange = (query = {}) => {
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from && to && from > to) {
    throw new InvariantError('from tidak boleh lebih besar dari to');
  }
  return { from, to };
};

const parsePagination = (query = {}, { defaultLimit = DEFAULT_LIMIT } = {}) => {
  const limit = parseNumber(query.limit, 'limit', {
    integer: true,
    min: 1,
    max: MAX_LIMIT,
  });
  const offset = parseNumber(query.offset, 'offset', {
    integer: true,
    min: 0,
  });
  return {
    limit: limit === null ? defaultLimit : limit,
    offset: offset === null ? 0 : offset,
  };
};

const parseArray = (raw, fieldName, { min = 1, max = 200 } = {}) => {
  if (!Array.isArray(raw)) {
    throw new InvariantError(`${fieldName} wajib berupa array`);
  }
  if (raw.length < min) {
    throw new InvariantError(`${fieldName} minimal berisi ${min} data`);
  }
  if (raw.length > max) {
    throw new InvariantError(`${fieldName} maksimal berisi ${max} data`);
  }
  return raw;
};

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ensureObject,
  parseText,
  parseSku,
  parseNewSku,
  parseNumber,
  parseBoolean,
  parseEnum,
  parseDate,
  parseDateRange,
  parsePagination,
  parseArray,
};
