
/**
 * Authentication Controller
 * Bertanggung jawab menangani HTTP request dan response.
 */

const authService = require('../services/authService');

/**
 * POST /api/authentications
 *
 * Login pengguna.
 */
const login = async (req, res) => {
  try {
    // 1. Ambil data dari request body
    const { username, password } = req.body || {};

    // 2. Validasi input
    if (
      typeof username !== 'string' ||
      username.trim().length === 0 ||
      typeof password !== 'string' ||
      password.length === 0
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Username dan password wajib diisi',
      });
    }

    // 3. Panggil authentication service
    const data = await authService.login(
      username.trim(),
      password,
    );

    // 4. Kirim response sukses
    return res.status(200).json({
      status: 'success',
      data,
    });

  } catch (error) {
    // 5. Kesalahan kredensial
    if (error.statusCode === 401) {
      return res.status(401).json({
        status: 'fail',
        message: 'Username atau password salah',
      });
    }

    // 6. Tangani kesalahan internal
    console.error('[Auth Controller] Login error:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
};

module.exports = {
  login,
};
