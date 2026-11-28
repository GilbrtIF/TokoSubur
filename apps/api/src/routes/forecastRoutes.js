const express = require('express');
const forecastController = require('../controllers/forecastController');
const { authGuard, serviceKeyOrRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Dibaca UI (semua user login)
router.get('/', authGuard, forecastController.getForecasts);
router.get('/models', authGuard, forecastController.getModels);
router.get('/demand-changes', authGuard, forecastController.getDemandChanges);
router.get(
  '/stock-projection',
  authGuard,
  forecastController.getStockProjection
);

// Dipakai ML service (X-Service-Key) atau admin
router.get(
  '/training-dataset',
  serviceKeyOrRole('admin'),
  forecastController.exportTrainingDataset
);
router.post(
  '/runs',
  serviceKeyOrRole('admin'),
  forecastController.createModelRun
);
router.post(
  '/runs/:runId/items',
  serviceKeyOrRole('admin'),
  forecastController.appendForecasts
);

// Ganti model aktif: ML service, admin, atau owner
router.put(
  '/models/:runId/activate',
  serviceKeyOrRole('admin', 'owner'),
  forecastController.activateModel
);

router.get('/sku/:sku', authGuard, forecastController.getSkuForecastChart);

module.exports = router;
