const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/dashboard/summary',
  authGuard,
  analyticsController.getDashboardSummary
);
router.get(
  '/analytics/sales',
  authGuard,
  analyticsController.getSalesAnalytics
);
router.get(
  '/analytics/top-products',
  authGuard,
  analyticsController.getTopProducts
);
router.get('/analytics/export', authGuard, analyticsController.exportSales);
router.get(
  '/marketplace-metrics',
  authGuard,
  analyticsController.getMarketplaceMetrics
);

module.exports = router;
