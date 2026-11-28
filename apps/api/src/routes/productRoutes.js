const express = require('express');
const productController = require('../controllers/productController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:sku', productController.getProductBySku);
router.post('/', productController.createProduct);
router.put('/:sku', productController.updateProduct);
router.delete(
  '/:sku',
  requireRole('admin', 'owner'),
  productController.deleteProduct
);

module.exports = router;
