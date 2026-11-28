const express = require('express');
const authController = require('../controllers/authController');
const { authGuard } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/authentications (publik)
router.post('/authentications', authController.login);

// Route di bawah ini wajib token
router.get('/auth/me', authGuard, authController.getMe);
router.put('/auth/password', authGuard, authController.changePassword);

module.exports = router;
