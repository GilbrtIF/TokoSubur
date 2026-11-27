const stockService = require('../services/stockService');
const stockHistoryService = require('../services/stockHistoryService');
const {
  validateStockHistoryQuery,
} = require('../validators/stockHistoryValidator');
const {
  validateStockQuery,
  validateStockMovementsRequest,
  validateBatchMovementsPayload,
  validateOpnameSheetQuery,
  validateOpnameHistoryQuery,
  validateOpnamePayload,
  validateStockImportCommitPayload,
} = require('../validators/stockValidator');

const getStocks = async (req, res, next) => {
  try {
    const query = validateStockQuery(req.query);
    const result = await stockService.getStocks(query);

    return res.status(200).json({
      status: 'success',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return next(error);
  }
};

const getStockSummary = async (req, res, next) => {
  try {
    const summary = await stockService.getStockSummary();

    return res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};

const getStockAlerts = async (req, res, next) => {
  try {
    const alerts = await stockService.getStockAlerts();

    return res.status(200).json({
      status: 'success',
      data: alerts,
    });
  } catch (error) {
    return next(error);
  }
};

const getStockMovements = async (req, res, next) => {
  try {
    const params = validateStockMovementsRequest(req.params, req.query);
    const result = await stockService.getStockMovements(params);

    return res.status(200).json({
      status: 'success',
      data: {
        product: result.product,
        movements: result.movements,
      },
      meta: result.meta,
    });
  } catch (error) {
    return next(error);
  }
};

const createBatchMovements = async (req, res, next) => {
  try {
    const payload = validateBatchMovementsPayload(req.body);
    const result = await stockService.createBatchMovements(payload);

    return res.status(201).json({
      status: 'success',
      message: 'Mutasi stok berhasil dicatat',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getOpnameSheet = async (req, res, next) => {
  try {
    const query = validateOpnameSheetQuery(req.query);
    const result = await stockService.getOpnameSheet(query);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getOpnameHistory = async (req, res, next) => {
  try {
    const query = validateOpnameHistoryQuery(req.query);
    const result = await stockService.getOpnameHistory(query);

    return res.status(200).json({
      status: 'success',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return next(error);
  }
};

const submitStockOpname = async (req, res, next) => {
  try {
    const payload = validateOpnamePayload(req.body);
    const result = await stockService.submitStockOpname(payload);

    return res.status(201).json({
      status: 'success',
      message: 'Stok opname berhasil disimpan',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const previewStockImport = async (req, res, next) => {
  try {
    const { file } = req;
    const result = await stockService.previewStockImport(file);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const commitStockImport = async (req, res, next) => {
  try {
    const payload = validateStockImportCommitPayload(req.body);
    const result = await stockService.commitStockImport({
      ...payload,
      importedBy: req.user ? req.user.username : null,
    });

    return res.status(201).json({
      status: 'success',
      message: `${result.insertedCount} baris mutasi stok berhasil disimpan`,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getStockHistory = async (req, res, next) => {
  try {
    const result = await stockHistoryService.getStockHistory(
      validateStockHistoryQuery(req.query)
    );
    return res
      .status(200)
      .json({ status: 'success', data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStockHistory,
  getStocks,
  getStockSummary,
  getStockAlerts,
  getStockMovements,
  createBatchMovements,
  getOpnameSheet,
  getOpnameHistory,
  submitStockOpname,
  previewStockImport,
  commitStockImport,
};
