const express = require('express');
const masterController = require('../controllers/masterController');
const { authGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/suppliers', authGuard, masterController.getSuppliers);
router.get('/channels', authGuard, masterController.getChannels);

module.exports = router;
