// apps/api/src/controllers/authController.js
const authService = require('../services/authService');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'fail', message: 'Username dan password wajib diisi' });
  }

  try {
    const data = await authService.login(username, password);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(401).json({ status: 'fail', message: error.message });
  }
};

module.exports = { login };