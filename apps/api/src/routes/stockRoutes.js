const express = require('express');
const stockController = require('../controllers/stockController');
const { uploadSingleStockFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/summary', stockController.getStockSummary);
router.get('/history', stockController.getStockHistory);
router.get('/alerts', stockController.getStockAlerts);
router.get('/opname/sheet', stockController.getOpnameSheet);
router.get('/opname', stockController.getOpnameHistory);
router.post('/opname', stockController.submitStockOpname);
router.post('/movements/batch', stockController.createBatchMovements);
router.get('/:sku/movements', stockController.getStockMovements);
router.get('/', stockController.getStocks);
router.post(
  '/import/preview',
  uploadSingleStockFile,
  stockController.previewStockImport
);
router.post('/import/commit', stockController.commitStockImport);

module.exports = router;
