// apps/api/src/services/authService.js
const pool = require('../config/db'); // ✅ Import dari config
const jwt = require('jsonwebtoken');

const login = async (username, password) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user) throw new Error('Username atau password salah');

  const isValidPassword = password === user.password_hash;
  if (!isValidPassword) throw new Error('Username atau password salah');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    accessToken: token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  };
};

module.exports = { login };