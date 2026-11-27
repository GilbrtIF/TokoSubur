/**
 * Authentication Service
 * Bertanggung jawab atas business logic autentikasi.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/userRepository');

const { jwtSecret, jwtExpiresIn } = require('../config/env');
const {
  AuthenticationError,
  InvariantError,
  NotFoundError,
} = require('../exceptions');

const BCRYPT_ROUNDS = 12;

const INVALID_CREDENTIALS_MESSAGE = 'Username atau password salah';

const createUnauthorizedError = () =>
  new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);

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
    username: user.username,
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

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
});

/**
 * Profil pengguna yang sedang login (dari token).
 */
const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    // Token valid tetapi user sudah tidak ada -> minta login ulang.
    throw new AuthenticationError(
      'Pengguna tidak ditemukan, silakan login ulang'
    );
  }
  return toPublicUser(user);
};

/**
 * Mengganti password pengguna yang sedang login.
 */
const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('Pengguna tidak ditemukan');
  }

  const isOldPasswordValid = await bcrypt.compare(
    oldPassword,
    user.password_hash
  );
  if (!isOldPasswordValid) {
    throw new InvariantError('Password lama tidak sesuai');
  }

  if (oldPassword === newPassword) {
    throw new InvariantError('Password baru harus berbeda dari password lama');
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepository.updatePasswordHash(userId, newHash);
};

module.exports = {
  login,
  getMe,
  changePassword,
};
