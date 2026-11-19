// apps/api/src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /authentications
router.post('/authentications', async (req, res) => {
  const { username, password } = req.body;

  // 1. Validasi input kosong
  if (!username || !password) {
    return res.status(400).json({ 
      status: 'fail', 
      message: 'Username dan password wajib diisi' 
    });
  }

  try {
    // 2. Cari user di database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // 3. Jika user tidak ditemukan
    if (!user) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Username atau password salah' 
      });
    }

    // 4. Validasi Password
    // CATATAN: Saat ini database Anda menyimpan password dalam bentuk plain text.
    // Untuk production, WAJIB gunakan bcrypt (contoh: await bcrypt.compare(password, user.password_hash))
    const isValidPassword = (password === user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Username atau password salah' 
      });
    }

    // 5. Buat JWT Token
    // Payload berisi data penting yang aman disimpan di token
    const tokenPayload = {
      id: user.id,
      role: user.role
    };

    const accessToken = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET || 'rahasia_default', // Gunakan JWT_SECRET dari .env
      { expiresIn: '1d' } // Token berlaku 1 hari
    );

    // 6. Kirim Response (Format disesuaikan dengan front-end authService.js)
    res.status(200).json({
      status: 'success',
      data: {
        accessToken: accessToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Terjadi kesalahan pada server' 
    });
  }
});

module.exports = router;