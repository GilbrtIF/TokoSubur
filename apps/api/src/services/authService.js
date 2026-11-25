/**
 * Authentication Service
 * Bertanggung jawab atas business logic autentikasi.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/userRepository');

const { jwtSecret, jwtExpiresIn } = require('../config/env');

/**
 * Membuat error autentikasi.
 *
 * @returns {Error}
 */
const createUnauthorizedError = () => {
  const error = new Error('Username atau password salah');
  error.statusCode = 401;

  return error;
};

/**
 * Login pengguna.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (username, password) => {
  // 1. Cari pengguna berdasarkan username
  const user = await userRepository.findByUsername(username);

  if (!user) {
    throw createUnauthorizedError();
  }

  // 2. Pastikan password tersimpan dalam format bcrypt
  // Tidak memperbolehkan perbandingan plaintext.
  const isBcryptHash =
    typeof user.password_hash === 'string' &&
    /^\$2[aby]\$\d{2}\$/.test(user.password_hash);

  if (!isBcryptHash) {
    const error = new Error(
      'Password pengguna belum dikonversi ke format bcrypt.'
    );

    error.code = 'PASSWORD_HASH_NOT_BCRYPT';

    throw error;
  }

  // 3. Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw createUnauthorizedError();
  }

  // 4. Buat payload JWT
  const payload = {
    id: user.id,
    role: user.role,
  };

  // 5. Generate access token
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  // 6. Kembalikan data pengguna
  return {
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
};

module.exports = {
  login,
};
