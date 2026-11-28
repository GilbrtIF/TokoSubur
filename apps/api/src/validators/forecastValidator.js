const { InvariantError } = require('../exceptions');
const {
  ensureObject,
  parseText,
  parseSku,
  parseEnum,
  parseNumber,
  parseBoolean,
  parseDate,
  parseDateRange,
  parsePagination,
  parseArray,
} = require('./common');

const GRANULARITAS = ['harian', 'mingguan', 'bulanan'];
const MAX_FORECAST_ITEMS_PER_REQUEST = 5000;

const parseRunId = (raw, fieldName = 'runId', required = false) =>
  parseNumber(raw, fieldName, { integer: true, min: 1, required });

const validateForecastQuery = (query = {}) => ({
  runId: parseRunId(query.runId),
  sku: parseSku(query.sku, 'sku', { required: false }),
  kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
  granularitas: parseEnum(query.granularitas, 'granularitas', GRANULARITAS),
  ...parseDateRange(query),
  ...parsePagination(query, { defaultLimit: 100 }),
});

const validateSkuChartRequest = (params = {}, query = {}) => {
  const historyDays = parseNumber(query.historyDays, 'historyDays', {
    integer: true,
    min: 7,
    max: 365,
  });
  return {
    sku: parseSku(params.sku, 'sku'),
    historyDays: historyDays === null ? 90 : historyDays,
  };
};

const validateDemandChangeQuery = (query = {}) => ({
  search: parseText(query.search, 'search', { maxLength: 100 }),
  direction: parseEnum(
    query.direction,
    'direction',
    ['semua', 'naik', 'turun'],
    { defaultValue: 'semua' }
  ),
  ...parsePagination(query),
});

const validateProjectionQuery = (query = {}) => ({
  search: parseText(query.search, 'search', { maxLength: 100 }),
  maxHari: parseNumber(query.maxHari, 'maxHari', {
    integer: true,
    min: 0,
    max: 3650,
  }),
  ...parsePagination(query),
});

const parseForecastItems = (raw, { min }) =>
  parseArray(raw, 'forecasts', {
    min,
    max: MAX_FORECAST_ITEMS_PER_REQUEST,
  }).map((item, index) => {
    const label = `forecasts[${index}]`;
    ensureObject(item, label);
    const qtyPrediksi = parseNumber(item.qtyPrediksi, `${label}.qtyPrediksi`, {
      required: true,
      min: 0,
    });
    const qtyBawah = parseNumber(item.qtyBawah, `${label}.qtyBawah`, {
      min: 0,
    });
    const qtyAtas = parseNumber(item.qtyAtas, `${label}.qtyAtas`, { min: 0 });
    if (qtyBawah !== null && qtyAtas !== null && qtyBawah > qtyAtas) {
      throw new InvariantError(
        `${label}.qtyBawah tidak boleh lebih besar dari qtyAtas`
      );
    }
    return {
      sku: parseSku(item.sku, `${label}.sku`),
      kanal: parseText(item.kanal, `${label}.kanal`, { maxLength: 30 }),
      periode: parseDate(item.periode, `${label}.periode`, { required: true }),
      granularitas: parseEnum(
        item.granularitas,
        `${label}.granularitas`,
        GRANULARITAS,
        { defaultValue: 'harian' }
      ),
      qtyPrediksi,
      qtyBawah,
      qtyAtas,
    };
  });

const validateCreateRunPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const metric = (key) => parseNumber(body[key], key, { min: 0 });
  const dilatihPada = parseText(body.dilatihPada, 'dilatihPada', {
    maxLength: 40,
  });
  if (dilatihPada && Number.isNaN(Date.parse(dilatihPada))) {
    throw new InvariantError('dilatihPada harus berupa tanggal/waktu ISO 8601');
  }
  const aktifkan = parseBoolean(body.aktifkan, 'aktifkan');

  return {
    run: {
      namaModel: parseText(body.namaModel, 'namaModel', {
        required: true,
        maxLength: 40,
      }),
      versiModel: parseText(body.versiModel, 'versiModel', { maxLength: 30 }),
      dilatihPada,
      trainMulai: parseDate(body.trainMulai, 'trainMulai'),
      trainSelesai: parseDate(body.trainSelesai, 'trainSelesai'),
      testMulai: parseDate(body.testMulai, 'testMulai'),
      testSelesai: parseDate(body.testSelesai, 'testSelesai'),
      wape: metric('wape'),
      mape: metric('mape'),
      rmse: metric('rmse'),
    },
    forecasts:
      body.forecasts === undefined
        ? []
        : parseForecastItems(body.forecasts, { min: 0 }),
    aktifkan: aktifkan === null ? false : aktifkan,
  };
};

const validateAppendForecastsPayload = (params, rawBody) => {
  const body = ensureObject(rawBody);
  return {
    runId: parseRunId(params.runId, 'runId', true),
    forecasts: parseForecastItems(body.forecasts, { min: 1 }),
  };
};

const validateRunIdParam = (params = {}) =>
  parseRunId(params.runId, 'runId', true);

const validateTrainingDatasetQuery = (query = {}) => parseDateRange(query);

module.exports = {
  validateForecastQuery,
  validateSkuChartRequest,
  validateDemandChangeQuery,
  validateProjectionQuery,
  validateCreateRunPayload,
  validateAppendForecastsPayload,
  validateRunIdParam,
  validateTrainingDatasetQuery,
};
