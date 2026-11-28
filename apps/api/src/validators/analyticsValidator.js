const { InvariantError } = require('../exceptions');
const {
  parseText,
  parseSku,
  parseEnum,
  parseNumber,
  parseDateRange,
  parsePagination,
} = require('./common');

const PERIODE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const baseFilter = (query = {}) => ({
  ...parseDateRange(query),
  kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
  kategori: parseText(query.kategori, 'kategori', { maxLength: 60 }),
});

const validateDashboardQuery = (query = {}) => ({
  ...parseDateRange(query),
  kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
});

const validateSalesQuery = (query = {}) => ({
  ...baseFilter(query),
  granularity: parseEnum(
    query.granularity,
    'granularity',
    ['harian', 'mingguan', 'bulanan'],
    {
      defaultValue: 'harian',
    }
  ),
});

const validateTopProductsQuery = (query = {}) => {
  const limit = parseNumber(query.limit, 'limit', {
    integer: true,
    min: 1,
    max: 50,
  });
  return {
    ...baseFilter(query),
    limit: limit === null ? 5 : limit,
    sortBy: parseEnum(query.sortBy, 'sortBy', ['revenue', 'qty'], {
      defaultValue: 'revenue',
    }),
  };
};

const validateExportQuery = (query = {}) => ({
  ...baseFilter(query),
  format: parseEnum(query.format, 'format', ['csv', 'xlsx'], {
    defaultValue: 'xlsx',
  }),
});

const validateMarketplaceQuery = (query = {}) => {
  const periode = parseText(query.periode, 'periode', { maxLength: 7 });
  if (periode && !PERIODE_PATTERN.test(periode)) {
    throw new InvariantError('periode harus berformat YYYY-MM');
  }
  return {
    periode,
    kanal: parseText(query.kanal, 'kanal', { maxLength: 30 }),
    sku: parseSku(query.sku, 'sku', { required: false }),
    ...parsePagination(query),
  };
};

module.exports = {
  validateDashboardQuery,
  validateSalesQuery,
  validateTopProductsQuery,
  validateExportQuery,
  validateMarketplaceQuery,
};
