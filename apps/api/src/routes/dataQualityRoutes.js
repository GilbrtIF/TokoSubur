const express = require('express');
const dataQualityController = require('../controllers/dataQualityController');
const { authGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/data-quality/status', authGuard, dataQualityController.getStatus);
router.get(
  '/data-quality/rejected',
  authGuard,
  dataQualityController.getRejectedRows
);
router.get(
  '/data-quality/ambiguous',
  authGuard,
  dataQualityController.getAmbiguousSales
);
router.get(
  '/import-batches',
  authGuard,
  dataQualityController.getImportBatches
);
router.get(
  '/product-mappings',
  authGuard,
  dataQualityController.getProductMappings
);
router.post(
  '/product-mappings',
  authGuard,
  dataQualityController.saveProductMapping
);

module.exports = router;
