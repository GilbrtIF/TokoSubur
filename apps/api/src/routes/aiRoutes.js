const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.get('/health', aiController.health);
router.post('/chat', aiController.chat);

module.exports = router;
