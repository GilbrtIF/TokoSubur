const transactionService = require('../services/transactionService');
const {
  validateTransactionListQuery,
  validateTransactionIdParam,
  validateCreateTransactionPayload,
  validateSalesImportCommitPayload,
} = require('../validators/transactionValidator');

const getTransactions = async (req, res, next) => {
  try {
    const filter = validateTransactionListQuery(req.query);
    const result = await transactionService.getTransactions(filter);
    return res
      .status(200)
      .json({ status: 'success', data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const id = validateTransactionIdParam(req.params);
    const data = await transactionService.getTransactionById(id);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const payload = validateCreateTransactionPayload(req.body);
    const data = await transactionService.createTransaction(payload);
    return res.status(201).json({
      status: 'success',
      message: `Transaksi ${data.transaction.transactionId} berhasil dicatat`,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const previewSalesImport = async (req, res, next) => {
  try {
    const data = await transactionService.previewSalesImport(req.file);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const commitSalesImport = async (req, res, next) => {
  try {
    const payload = validateSalesImportCommitPayload(req.body);
    const data = await transactionService.commitSalesImport({
      ...payload,
      importedBy: req.user ? req.user.username : null,
    });
    return res.status(201).json({
      status: 'success',
      message: `${data.transactionCount} transaksi (${data.insertedItemCount} item) berhasil disimpan`,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  previewSalesImport,
  commitSalesImport,
};
