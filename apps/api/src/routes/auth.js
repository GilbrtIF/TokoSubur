
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/authentications
router.post('/authentications', authController.login);

module.exports = router;
