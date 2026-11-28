const express = require('express');
const transactionController = require('../controllers/transactionController');
const { uploadSingleFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.post(
  '/import/preview',
  uploadSingleFile,
  transactionController.previewSalesImport
);
router.post('/import/commit', transactionController.commitSalesImport);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
