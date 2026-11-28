const {
  parseEnum,
  parseBoolean,
  parseDateRange,
  parsePagination,
} = require('./common');

const validateStockHistoryQuery = (query = {}) => {
  const includeItems = parseBoolean(query.includeItems, 'includeItems');
  return {
    type: parseEnum(query.type, 'type', ['all', 'opname', 'import', 'manual'], {
      defaultValue: 'all',
    }),
    ...parseDateRange(query),
    includeItems: includeItems === null ? true : includeItems,
    ...parsePagination(query, { defaultLimit: 20 }),
  };
};

module.exports = {
  validateStockHistoryQuery,
};
