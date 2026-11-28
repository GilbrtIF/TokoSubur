const analyticsService = require('../services/analyticsService');
const {
  validateDashboardQuery,
  validateSalesQuery,
  validateTopProductsQuery,
  validateExportQuery,
  validateMarketplaceQuery,
} = require('../validators/analyticsValidator');

const getDashboardSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboardSummary(
      validateDashboardQuery(req.query)
    );
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const getSalesAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getSalesAnalytics(
      validateSalesQuery(req.query)
    );
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const data = await analyticsService.getTopProducts(
      validateTopProductsQuery(req.query)
    );
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const exportSales = async (req, res, next) => {
  try {
    const result = await analyticsService.exportSales(
      validateExportQuery(req.query)
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`
    );
    res.setHeader('X-Row-Count', String(result.rowCount));
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, X-Row-Count'
    );
    return res.status(200).send(result.buffer);
  } catch (error) {
    return next(error);
  }
};

const getMarketplaceMetrics = async (req, res, next) => {
  try {
    const result = await analyticsService.getMarketplaceMetrics(
      validateMarketplaceQuery(req.query)
    );
    return res
      .status(200)
      .json({ status: 'success', data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getTopProducts,
  exportSales,
  getMarketplaceMetrics,
};
