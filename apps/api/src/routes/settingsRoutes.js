const express = require('express');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/reorder', settingsController.getReorderSettings);
router.put('/reorder', settingsController.updateReorderSettingsBulk);
router.put('/reorder/:sku', settingsController.updateReorderSetting);

module.exports = router;
